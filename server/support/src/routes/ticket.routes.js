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

router.route("/").post(authenticate, createTicket);
router.route("/").get(authenticate, requirePlatformAdmin, getAllTickets);
router.route("/my").get(authenticate, requireCustomer, getMyTickets);
router
  .route("/:ticketNumber/status")
  .patch(authenticate, requirePlatformAdmin, updateTicketStatus);
router.route("/:ticketNumber").delete(authenticate, deleteTicket);
router.route("/:ticketNumber").patch(authenticate, editTicket);

export default router;
