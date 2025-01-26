import { 
  pgTable, 
  text, 
  serial, 
  timestamp, 
  boolean,
  uniqueIndex,
  uuid,
  primaryKey
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Base users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  role: text("role", { enum: ["client", "service"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Clients table with additional client-specific information
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  county: text("county"),
  city: text("city"),
});

// Services table for service providers
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  companyName: text("company_name").notNull(),
  representativeName: text("representative_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  county: text("county"),
  city: text("city"),
});

// Email verification tokens
export const verificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  token: uuid("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  token: uuid("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ one }) => ({
  client: one(clients, {
    fields: [users.id],
    references: [clients.userId],
  }),
  service: one(services, {
    fields: [users.id],
    references: [services.userId],
  }),
}));

// Create Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertClientSchema = createInsertSchema(clients);
export const selectClientSchema = createSelectSchema(clients);

export const insertServiceSchema = createInsertSchema(services);
export const selectServiceSchema = createSelectSchema(services);

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;