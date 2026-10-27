import { Router } from "express";
import {
  addUser,
  authenticate,
  deleteUser,
  getAllUsers,
  getMe,
  login,
  logout,
  register,
  requireAdmin,
} from "../controllers/auth.controller.js";
import { googleAuth } from "../controllers/google.controller.js";

const router = Router();

router.post("/google", googleAuth);

router.post("/register", register);
router.post("/users", authenticate, addUser);
router.get("/users", authenticate, getAllUsers);
router.delete("/users/:id", authenticate, requireAdmin, deleteUser);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
