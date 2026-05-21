import { Router } from "express";
import {
  isValidId,
  itemExists,
  getAvailableItems,
  getSelectedItems,
  addCustomId,
  selectItem,
  unselectItem,
  selectedIds,
} from "../state.js";

const router = Router();

// GET /api/items/available
router.get("/available", (req, res) => {
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
router.get("/selected", (req, res) => {
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
router.post("/add", (req, res) => {
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
router.post("/select", (req, res) => {
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
router.post("/unselect", (req, res) => {
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

export default router;
