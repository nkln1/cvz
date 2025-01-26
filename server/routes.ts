import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { sendContactEmail } from "./services/email";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes and middleware
  setupAuth(app);

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, phone, message } = req.body;

      if (!name || !email || !phone || !message) {
        return res.status(400).json({ 
          message: "Toate câmpurile sunt obligatorii" 
        });
      }

      await sendContactEmail({ name, email, phone, message });
      res.json({ message: "Mesajul a fost trimis cu succes!" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ 
        message: "A apărut o eroare la trimiterea mesajului. Vă rugăm încercați din nou." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}