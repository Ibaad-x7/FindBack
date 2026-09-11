import { Router } from "express";
import {
  register,
  login,
  me,
  updateProfile,
  changePassword,
  getUserStats,
} from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);
router.get("/stats", requireAuth, getUserStats);

export default router;
