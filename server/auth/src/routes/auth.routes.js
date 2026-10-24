import { Router } from "express";
import {
  addUser,
  authenticate,
  getMe,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/users", authenticate, addUser);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.post("/logout", logout);

export default router;
