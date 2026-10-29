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
import { authLimiter, passwordResetLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

// google auth route
router.route("/google").post(authLimiter, googleAuth);


router.route("/register").post(authLimiter, register);
router.route("/login").post(authLimiter, login);

router.route("/forgot-password").post(passwordResetLimiter, forgotPassword);
router.route("/reset-password").post(passwordResetLimiter, resetPassword);

router.route("/users").post(authenticate, addUser);
router.route("/users").get(authenticate, getAllUsers);
router.route("/users/:id").delete(authenticate, requireAdmin, deleteUser);
router.route("/me").get(authenticate, getMe);
router.route("/logout").post(authenticate, logout);

export default router;
