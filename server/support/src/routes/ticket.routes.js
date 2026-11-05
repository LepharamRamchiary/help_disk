import { Router } from "express";
import {
  createTicket,
  editTicket,
} from "../controllers/ticket.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, createTicket);
router.patch("/:ticketNumber", authenticate, editTicket);

export default router;