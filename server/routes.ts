import type { Express } from "express";
import { createServer, type Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { db } from "@db";

interface ServiceNotification {
  type: 'new_request' | 'new_message' | 'appointment_update';
  message: string;
  timestamp: string;
  data?: any;
}

const serviceConnections = new Map<string, WebSocket>();

export function registerRoutes(app: Express): Server {
  // API routes
  app.get('/api/service/requests', async (req, res) => {
    try {
      // Temporary mock data until DB integration
      const requests = [
        {
          id: "1",
          clientName: "John Doe",
          carDetails: "BMW X5 2020",
          serviceType: "Maintenance",
          status: "pending",
          date: new Date().toISOString()
        }
      ];
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/ws",
    // Ignore Vite HMR websocket connections
    verifyClient: ({ req }) => {
      return req.headers['sec-websocket-protocol'] !== 'vite-hmr';
    }
  });

  wss.on('connection', (ws, req) => {
    const serviceId = req.url?.split('?serviceId=')[1];

    if (serviceId) {
      serviceConnections.set(serviceId, ws);

      ws.on('close', () => {
        serviceConnections.delete(serviceId);
      });
    }
  });

  // Helper function to send notifications
  const sendServiceNotification = (serviceId: string, notification: ServiceNotification) => {
    const connection = serviceConnections.get(serviceId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify(notification));
    }
  };

  // Example route to trigger notifications (for testing)
  app.post('/api/service/test-notification', (req, res) => {
    const { serviceId } = req.body;
    if (serviceId) {
      sendServiceNotification(serviceId, {
        type: 'new_request',
        message: 'New service request received',
        timestamp: new Date().toISOString(),
      });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Service ID required' });
    }
  });

  return httpServer;
}