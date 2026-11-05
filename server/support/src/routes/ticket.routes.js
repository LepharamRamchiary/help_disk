import { Router } from "express";
import {
  createTicket,
  editTicket,
  getAllTickets,
} from "../controllers/ticket.controller.js";
import {
  authenticate,
  requirePlatformAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, createTicket);
router.get("/", authenticate, requirePlatformAdmin, getAllTickets);
router.patch("/:ticketNumber", authenticate, editTicket);

export default router;