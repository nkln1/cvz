import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express): Server {
  // Set up authentication routes and middleware
  setupAuth(app);

  // put application routes here
  // prefix all routes with /api

  const httpServer = createServer(app);

  return httpServer;
}