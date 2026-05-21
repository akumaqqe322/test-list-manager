import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  isValidId,
  itemExists,
  getAvailableItems,
  getSelectedItems,
  addCustomId,
  selectItem,
  unselectItem,
  selectedIds,
} from "./server/state.js"; // note: using relative import, typescript runner will figure it out

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON body
  app.use(express.json());

  // GET /api/health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // GET /api/items/available
  app.get("/api/items/available", (req, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const cursor = req.query.cursor ? Number(req.query.cursor) : 0;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      if (req.query.cursor && !Number.isInteger(cursor)) {
        res.status(400).json({ error: "Cursor must be an integer" });
        return;
      }
      if (req.query.limit && (!Number.isInteger(limit) || limit <= 0)) {
        res.status(400).json({ error: "Limit must be a positive integer" });
        return;
      }

      const result = getAvailableItems(search, cursor, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/items/selected
  app.get("/api/items/selected", (req, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const cursor = req.query.cursor ? Number(req.query.cursor) : 0;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      if (req.query.cursor && !Number.isInteger(cursor)) {
        res.status(400).json({ error: "Cursor must be an integer" });
        return;
      }
      if (req.query.limit && (!Number.isInteger(limit) || limit <= 0)) {
        res.status(400).json({ error: "Limit must be a positive integer" });
        return;
      }

      const result = getSelectedItems(search, cursor, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/items/add
  app.post("/api/items/add", (req, res) => {
    try {
      const { id } = req.body;

      if (id === undefined) {
        res.status(400).json({ error: "id field is required" });
        return;
      }

      if (!isValidId(id)) {
        res.status(400).json({ error: "ID must be a positive safe integer" });
        return;
      }

      if (itemExists(id)) {
        res.status(400).json({ error: `ID ${id} already exists in the system` });
        return;
      }

      addCustomId(id);
      res.status(201).json({ success: true, addedId: id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/items/select
  app.post("/api/items/select", (req, res) => {
    try {
      const { id } = req.body;

      if (id === undefined) {
        res.status(400).json({ error: "id field is required" });
        return;
      }

      if (!isValidId(id)) {
        res.status(400).json({ error: "ID must be a positive safe integer" });
        return;
      }

      if (!itemExists(id)) {
        res.status(404).json({ error: `ID ${id} does not exist in the system` });
        return;
      }

      if (selectedIds.has(id)) {
        res.status(400).json({ error: `ID ${id} is already selected` });
        return;
      }

      selectItem(id);
      res.json({ success: true, selectedId: id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/items/unselect
  app.post("/api/items/unselect", (req, res) => {
    try {
      const { id } = req.body;

      if (id === undefined) {
        res.status(400).json({ error: "id field is required" });
        return;
      }

      if (!isValidId(id)) {
        res.status(400).json({ error: "ID must be a positive safe integer" });
        return;
      }

      if (!selectedIds.has(id)) {
        res.status(400).json({ error: `ID ${id} is not currently selected` });
        return;
      }

      unselectItem(id);
      res.json({ success: true, unselectedId: id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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
