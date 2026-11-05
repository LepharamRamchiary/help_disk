import { Router } from "express";
import { createTicket } from "../controllers/ticket.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, createTicket);

export default router;