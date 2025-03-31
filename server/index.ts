import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from 'cors';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import session from "express-session";
import { setupVite } from "./vite";
import http from "http";

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" }
  })
);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Initialize routes - do this immediately instead of in an async function
let routesInitialized = false;
let routeInitializationPromise: Promise<any> | null = null;

function initializeRoutes() {
  if (!routesInitialized && !routeInitializationPromise) {
    routeInitializationPromise = registerRoutes(app).then(() => {
      routesInitialized = true;
    });
  }
  return routeInitializationPromise;
}

// Initialize routes immediately
initializeRoutes();

// Development setup with Vite
if (process.env.NODE_ENV !== "production") {
  setupVite(app, server);
}

// Sample API endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  // Send response but don't throw an error afterward
  res.status(status).json({ message });
});

// Handle Vercel serverless function request
const handler = async (req: VercelRequest, res: VercelResponse) => {
  // Wait for routes to be initialized
  if (!routesInitialized && routeInitializationPromise) {
    try {
      await routeInitializationPromise;
    } catch (error) {
      console.error("Error initializing routes:", error);
    }
  }
  
  // Process the request with Express
  return new Promise((resolve, reject) => {
    // @ts-ignore - Vercel's request/response are compatible with Express but TypeScript doesn't know
    app(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(undefined);
    });
  });
};

// Export the handler function for Vercel
export default handler;

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
