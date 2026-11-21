import { Router } from "express";
import {
  createTicket,
  deleteTicket,
  editTicket,
  getAllTickets,
  getMyTickets,
  getTicketSummary,
  getTodayTickets,
  addTicketMessage,
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
router.route("/summary").get(authenticate, requirePlatformAdmin, getTicketSummary);
router.route("/today").get(authenticate, requirePlatformAdmin, getTodayTickets);
router.route("/now").get(authenticate, requirePlatformAdmin, getTodayTickets);
router
  .route("/:ticketNumber/messages")
  .post(authenticate, addTicketMessage);
router
  .route("/:ticketNumber/status")
  .patch(authenticate, requirePlatformAdmin, updateTicketStatus);
router.route("/:ticketNumber").delete(authenticate, deleteTicket);
router.route("/:ticketNumber").patch(authenticate, editTicket);

export default router;
