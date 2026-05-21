import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import itemsRouter from "./server/routes/items.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware to parse JSON body
  app.use(express.json());

  // GET /api/health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Mount modular route definitions
  app.use("/api/items", itemsRouter);

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    // Development mode with Vite Dev Server Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    // Production Mode: static files served from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static build delivery active.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server actively running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
