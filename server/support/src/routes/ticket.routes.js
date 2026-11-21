import { Router } from "express";
import {
  createTicket,
  deleteTicket,
  editTicket,
  getAllTickets,
  getTicketAttachment,
  getMyTickets,
  getTicketSummary,
  getTodayTickets,
  addTicketMessage,
  authorizeTicketMessage,
  updateTicketStatus,
} from "../controllers/ticket.controller.js";
import {
  cleanupFailedUploads,
  receiveAttachments,
} from "../middlewares/upload.middleware.js";
import {
  authenticate,
  requireCustomer,
  requirePlatformAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .post(authenticate, receiveAttachments, cleanupFailedUploads, createTicket);
router.route("/").get(authenticate, requirePlatformAdmin, getAllTickets);
router.route("/my").get(authenticate, requireCustomer, getMyTickets);
router.route("/summary").get(authenticate, requirePlatformAdmin, getTicketSummary);
router.route("/today").get(authenticate, requirePlatformAdmin, getTodayTickets);
router.route("/now").get(authenticate, requirePlatformAdmin, getTodayTickets);
router
  .route("/:ticketNumber/messages")
  .post(
    authenticate,
    authorizeTicketMessage,
    receiveAttachments,
    cleanupFailedUploads,
    addTicketMessage,
  );
router
  .route("/:ticketNumber/attachments/:attachmentId")
  .get(authenticate, getTicketAttachment);
router
  .route("/:ticketNumber/status")
  .patch(authenticate, requirePlatformAdmin, updateTicketStatus);
router.route("/:ticketNumber").delete(authenticate, deleteTicket);
router.route("/:ticketNumber").patch(authenticate, editTicket);

export default router;
