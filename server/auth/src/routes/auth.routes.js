import { Router } from "express";
import {
  addUser,
  authenticate,
  getAllUsers,
  getMe,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/users", authenticate, addUser);
router.get("/users", authenticate, getAllUsers);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
