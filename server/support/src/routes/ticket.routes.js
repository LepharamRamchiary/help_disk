import { Router } from "express";
import {
  createTicket,
  deleteTicket,
  editTicket,
  getAllTickets,
  getMyTickets,
  updateTicketStatus,
} from "../controllers/ticket.controller.js";
import {
  authenticate,
  requireCustomer,
  requirePlatformAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, createTicket);
router.get("/", authenticate, requirePlatformAdmin, getAllTickets);
router.get("/my", authenticate, requireCustomer, getMyTickets);
router.patch(
  "/:ticketNumber/status",
  authenticate,
  requirePlatformAdmin,
  updateTicketStatus,
);
router.delete("/:ticketNumber", authenticate, deleteTicket);
router.patch("/:ticketNumber", authenticate, editTicket);

export default router;