import express from "express";
import {
  getAllUsersAdmin,
  getUserStats,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.get("/admin/all", protect, admin, getAllUsersAdmin);
router.get("/admin/stats", protect, admin, getUserStats);
router.put("/:id/role", protect, admin, updateUserRole);
router.delete("/:id", protect, admin, deleteUser);

export default router;
