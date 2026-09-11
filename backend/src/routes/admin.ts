import { Router } from "express";
import {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAdminItems,
} from "../controllers/adminController";
import { requireAuth } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/adminMiddleware";

const router = Router();

// All admin routes strictly enforce authentication, then admin authorization
router.use(requireAuth, requireAdmin);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/items", getAdminItems);

export default router;

