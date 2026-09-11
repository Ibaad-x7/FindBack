import { Router } from "express";
import {
  createContactRequest,
  getReceivedRequests,
  getSentRequests,
  updateRequestStatus,
} from "../controllers/contactRequestController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// All contact request routes require authentication
router.post("/", requireAuth, createContactRequest);
router.get("/received", requireAuth, getReceivedRequests);
router.get("/sent", requireAuth, getSentRequests);
router.patch("/:id/status", requireAuth, updateRequestStatus);

export default router;

