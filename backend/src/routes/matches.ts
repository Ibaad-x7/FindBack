import { Router } from "express";
import {
  runMatching,
  getMatches,
  getMatchById,
  updateMatchStatus,
} from "../controllers/matchController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.post("/run", requireAuth, runMatching);
router.get("/", requireAuth, getMatches);
router.get("/:id", requireAuth, getMatchById);
router.patch("/:id/status", requireAuth, updateMatchStatus);

export default router;
