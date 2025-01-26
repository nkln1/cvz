import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import { users, verificationTokens, type User as SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "./services/email";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "carvizio-secure-session",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return done(null, false, { message: "Incorrect email." });
          }

          const isMatch = await argon2.verify(user.password, password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password." });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, role } = req.body;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Email already exists");
      }

      // Hash password
      const hashedPassword = await argon2.hash(password);

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          role,
          emailVerified: false,
        })
        .returning();

      // Create verification token
      const token = randomUUID();
      await db.insert(verificationTokens).values({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, token);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Don't fail registration if email fails, but log it
      }

      res.json({
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).send("Registration failed");
    }
  });

  app.post("/api/resend-verification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      // Delete any existing verification tokens for this user
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.userId, req.user.id));

      // Create new verification token
      const token = randomUUID();
      await db.insert(verificationTokens).values({
        userId: req.user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Send verification email
      await sendVerificationEmail(req.user.email, token);

      res.json({
        message: "Verification email sent",
      });
    } catch (error) {
      console.error("Error resending verification:", error);
      res.status(500).send("Failed to resend verification email");
    }
  });

  app.post("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.body;

      // Find and validate token
      const [verificationToken] = await db
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.token, token))
        .limit(1);

      if (!verificationToken) {
        return res.status(400).send("Invalid verification token");
      }

      if (new Date() > verificationToken.expiresAt) {
        return res.status(400).send("Verification token expired");
      }

      // Update user's email verification status
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, verificationToken.userId));

      // Delete used token
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.id, verificationToken.id));

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).send("Email verification failed");
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    });
  });
}