import nodemailer from "nodemailer";

// Create test account for development if SMTP credentials are not provided
async function createTestAccount() {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // Use SSL/TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
  }
  console.log("No SMTP credentials found, using test account");
  return createTestAccount();
}

export async function sendVerificationEmail(email: string, token: string) {
  try {
    console.log("Creating email transporter...");
    const transporter = await getTransporter();

    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection verified successfully");

    const verificationUrl = `${process.env.NODE_ENV === 'production' 
      ? 'https://' 
      : 'http://'}${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/verify-email?token=${token}`;

    console.log("Sending verification email to:", email);
    const mailOptions = {
      from: `"CARVIZIO" <${process.env.SMTP_USER || 'noreply@carvizio.com'}>`,
      to: email,
      subject: "Confirmă adresa de email - CARVIZIO",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00aff5;">Bine ai venit la CARVIZIO!</h2>
          <p>Pentru a-ți activa contul, te rugăm să confirmi adresa de email făcând click pe butonul de mai jos:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #00aff5; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 5px;
                      display: inline-block;">
              Confirmă adresa de email
            </a>
          </div>
          <p>Sau copiază și accesează acest link în browserul tău:</p>
          <p style="word-break: break-all; color: #666;">
            ${verificationUrl}
          </p>
          <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
            Dacă nu tu ai creat acest cont, te rugăm să ignori acest email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully:", info.messageId);

    if (process.env.NODE_ENV !== 'production') {
      // Log preview URL for test accounts
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}