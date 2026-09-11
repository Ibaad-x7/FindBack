import { Router } from "express";
import { uploadImage } from "../controllers/uploadController";
import { requireAuth } from "../middleware/authMiddleware";
import { uploadItemImageMiddleware } from "../middleware/uploadMiddleware";

const router = Router();

// POST /api/upload/image
// Protected route for uploading item photos (field name: 'image')
router.post(
  "/image",
  requireAuth,
  uploadItemImageMiddleware("image"),
  uploadImage
);

export default router;

