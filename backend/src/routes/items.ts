import { Router } from "express";
import {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  updateItemStatus,
  deleteItem,
} from "../controllers/itemController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Public
router.get("/", getItems);

// Authenticated — must be registered before "/:id" so "my" isn't parsed
// as an item id.
router.get("/my", requireAuth, getMyItems);

// Public
router.get("/:id", getItemById);

// Authenticated
router.post("/", requireAuth, createItem);
router.put("/:id", requireAuth, updateItem);
router.patch("/:id/status", requireAuth, updateItemStatus);
router.delete("/:id", requireAuth, deleteItem);

export default router;
