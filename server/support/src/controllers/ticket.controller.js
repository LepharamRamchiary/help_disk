import { randomBytes } from "node:crypto";
import { Ticket } from "../models/ticket.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const PRIORITIES = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const TICKET_STATUSES = [
  "Open",
  "In Progress",
  "Pending",
  "Resolved",
  "Closed",
];

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/json",
  "application/xml",
  "text/xml",
]);
const MAX_ATTACHMENT_SIZE = 4 * 1024 * 1024;
const MAX_ATTACHMENT_BATCH_SIZE = 6 * 1024 * 1024;
const MAX_TICKET_ATTACHMENT_SIZE = 8 * 1024 * 1024;

const formatFileSize = (size) => {
  const kilobytes = Math.max(1, Math.round(size / 1024));
  return kilobytes >= 1024
    ? `${(kilobytes / 1024).toFixed(1)} MB`
    : `${kilobytes} KB`;
};

const parseAttachments = (value, uploadedBy) => {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.length > 5) {
    throw new ApiError(400, "Provide no more than 5 attachments at a time");
  }

  let batchSize = 0;
  return value.map((attachment) => {
    if (!attachment || typeof attachment !== "object" || Array.isArray(attachment)) {
      throw new ApiError(400, "An attachment is invalid");
    }

    const fileName =
      typeof attachment.fileName === "string"
        ? attachment.fileName.trim().replace(/[\\/]/g, "")
        : "";
    const mimeType =
      typeof attachment.mimeType === "string"
        ? attachment.mimeType.trim().toLowerCase()
        : "";
    const dataUrl =
      typeof attachment.dataUrl === "string" ? attachment.dataUrl : "";
    const dataUrlMatch =
      /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
        dataUrl,
      );

    if (
      !fileName ||
      fileName.length > 255 ||
      !ALLOWED_ATTACHMENT_TYPES.has(mimeType) ||
      !dataUrlMatch ||
      dataUrlMatch[1] !== mimeType
    ) {
      throw new ApiError(400, "An attachment has invalid file data or type");
    }

    const encodedData = dataUrlMatch[2];
    const fileData = Buffer.from(encodedData, "base64");
    if (
      fileData.length === 0 ||
      fileData.length > MAX_ATTACHMENT_SIZE ||
      fileData.toString("base64") !== encodedData
    ) {
      throw new ApiError(400, "Attachments must be no larger than 4 MB each");
    }

    batchSize += fileData.length;
    if (batchSize > MAX_ATTACHMENT_BATCH_SIZE) {
      throw new ApiError(400, "Attachments must total 6 MB or less per upload");
    }

    return {
      id: randomBytes(12).toString("hex"),
      fileName,
      fileSize: formatFileSize(fileData.length),
      fileType: mimeType.startsWith("image/")
        ? "image"
        : mimeType === "application/pdf"
          ? "pdf"
          : "log",
      mimeType,
      dataUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
    };
  });
};

const getTicketAttachmentSize = (ticket) => {
  const attachments = [
    ...(ticket.attachments || []),
    ...(ticket.messages || []).flatMap((message) => message.attachments || []),
  ];
  return attachments.reduce((size, attachment) => {
    if (typeof attachment.dataUrl !== "string") {
      return size;
    }
    const match = /;base64,([A-Za-z0-9+/]+={0,2})$/.exec(attachment.dataUrl);
    return size + (match ? Buffer.from(match[1], "base64").length : 0);
  }, 0);
};

// ========== Create a new ticket ==========
const createTicket = asyncHandler(async (req, res) => {
  const { subject, description, category, priority = "MEDIUM" } = req.body ?? {};
  const normalizedCategory =
    typeof category === "string" ? category.trim() : "";
  const normalizedSubject =
    typeof subject === "string" ? subject.trim() : "";
  const normalizedDescription =
    typeof description === "string" ? description.trim() : "";

  if (normalizedSubject.length < 5 || normalizedSubject.length > 200) {
    throw new ApiError(400, "Subject must be between 5 and 200 characters");
  }

  if (
    normalizedDescription.length < 15 ||
    normalizedDescription.length > 2000
  ) {
    throw new ApiError(
      400,
      "Description must be between 15 and 2000 characters",
    );
  }

  if (!normalizedCategory || normalizedCategory.length > 100) {
    throw new ApiError(400, "A valid support category is required");
  }

  if (
    typeof priority !== "string" ||
    !Object.hasOwn(PRIORITIES, priority)
  ) {
    throw new ApiError(400, "A valid priority is required");
  }

  const { id, name, email } = req.authenticatedUser;
  const attachments = parseAttachments(req.body?.attachments, name);
  const ticket = await Ticket.create({
    ticketNumber: `HD-${Date.now()}-${randomBytes(6).toString("hex").toUpperCase()}`,
    subject: normalizedSubject,
    description: normalizedDescription,
    category: normalizedCategory,
    priority: PRIORITIES[priority],
    requester: id,
    requesterName: name.trim(),
    requesterEmail: email.trim().toLowerCase(),
    attachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, ticket, "Ticket created successfully"));
});

// ========== Get all tickets ==========
const getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, tickets, "Tickets retrieved successfully"));
});

// ========== Get user's tickets ==========
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({
    requester: req.authenticatedUser.id,
  }).sort({ createdAt: -1 });
  const customerTickets = tickets.map((ticket) => {
    const customerTicket = ticket.toObject();
    customerTicket.messages = (customerTicket.messages || []).filter(
      (message) => !message.isInternalNote,
    );
    return customerTicket;
  });
  return res
    .status(200)
    .json(new ApiResponse(200, customerTickets, "Your tickets retrieved successfully"));
});

// ========== Get today's tickets ==========
const getTodayTickets = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const tickets = await Ticket.find({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tickets, "Today's tickets retrieved successfully"));
});

// ========== Get ticket summary ==========
const getTicketSummary = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [totalTickets, openTickets, inProgressTickets, pendingTickets, resolvedTickets, closedTickets, todayTickets, lowPriorityTickets, mediumPriorityTickets, highPriorityTickets, urgentPriorityTickets] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: "Open" }),
    Ticket.countDocuments({ status: "In Progress" }),
    Ticket.countDocuments({ status: "Pending" }),
    Ticket.countDocuments({ status: "Resolved" }),
    Ticket.countDocuments({ status: "Closed" }),
    Ticket.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }),
    Ticket.countDocuments({ priority: "Low" }),
    Ticket.countDocuments({ priority: "Medium" }),
    Ticket.countDocuments({ priority: "High" }),
    Ticket.countDocuments({ priority: "Urgent" }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      totalTickets,
      todayTickets,
      byStatus: {
        Open: openTickets,
        "In Progress": inProgressTickets,
        Pending: pendingTickets,
        Resolved: resolvedTickets,
        Closed: closedTickets,
      },
      byPriority: {
        Low: lowPriorityTickets,
        Medium: mediumPriorityTickets,
        High: highPriorityTickets,
        Urgent: urgentPriorityTickets,
      },
    }, "Ticket summary retrieved successfully"),
  );
});

const getTodaysTickets = getTodayTickets;

// ================ Edit a ticket ==========
const editTicket = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "A ticket update body is required");
  }

  const allowedFields = new Set([
    "subject",
    "description",
    "category",
    "priority",
  ]);
  const fields = Object.keys(body);
  if (fields.length === 0 || fields.some((field) => !allowedFields.has(field))) {
    throw new ApiError(400, "Provide valid ticket fields to update");
  }

  const updates = {};
  for (const field of fields) {
    const value = body[field];
    if (typeof value !== "string") {
      throw new ApiError(400, `${field} must be a string`);
    }

    const normalizedValue = value.trim();
    if (field === "subject") {
      if (normalizedValue.length < 5 || normalizedValue.length > 200) {
        throw new ApiError(400, "Subject must be between 5 and 200 characters");
      }
      updates.subject = normalizedValue;
    } else if (field === "description") {
      if (normalizedValue.length < 15 || normalizedValue.length > 2000) {
        throw new ApiError(
          400,
          "Description must be between 15 and 2000 characters",
        );
      }
      updates.description = normalizedValue;
    } else if (field === "category") {
      if (!normalizedValue || normalizedValue.length > 100) {
        throw new ApiError(400, "A valid support category is required");
      }
      updates.category = normalizedValue;
    } else if (field === "priority") {
      if (!Object.hasOwn(PRIORITIES, normalizedValue)) {
        throw new ApiError(400, "A valid priority is required");
      }
      updates.priority = PRIORITIES[normalizedValue];
    }
  }

  const ticket = await Ticket.findOneAndUpdate(
    {
      ticketNumber: req.params.ticketNumber,
      requester: req.authenticatedUser.id,
    },
    { $set: updates },
    { new: true, runValidators: true },
  );

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Ticket updated successfully"));
});

// ================ Update ticket status ==========
const updateTicketStatus = asyncHandler(async (req, res) => {
  const body = req.body;
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== 1 ||
    !Object.hasOwn(body, "status")
  ) {
    throw new ApiError(400, "Provide only a status to update");
  }

  const { status } = body;
  if (typeof status !== "string" || !TICKET_STATUSES.includes(status)) {
    throw new ApiError(
      400,
      `Status must be one of: ${TICKET_STATUSES.join(", ")}`,
    );
  }

  const ticket = await Ticket.findOneAndUpdate(
    { ticketNumber: req.params.ticketNumber },
    { $set: { status } },
    { new: true, runValidators: true },
  );

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Ticket status updated successfully"));
});

// ================ Add ticket message ================
const addTicketMessage = asyncHandler(async (req, res) => {
  const body = req.body;
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some(
      (field) =>
        field !== "body" &&
        field !== "isInternalNote" &&
        field !== "attachments",
    )
  ) {
    throw new ApiError(400, "Provide a valid ticket message");
  }

  if (
    Object.hasOwn(body, "isInternalNote") &&
    typeof body.isInternalNote !== "boolean"
  ) {
    throw new ApiError(400, "isInternalNote must be a boolean");
  }

  const messageBody = typeof body.body === "string" ? body.body.trim() : "";
  if (messageBody.length > 5000) {
    throw new ApiError(400, "Message must be no more than 5000 characters");
  }

  const isInternalNote = body.isInternalNote === true;
  const { id, name, email, role } = req.authenticatedUser;
  const attachments = parseAttachments(body.attachments, name);
  if (!messageBody && attachments.length === 0) {
    throw new ApiError(400, "A message or attachment is required");
  }

  if (isInternalNote && role !== "PLATFORM_ADMIN") {
    throw new ApiError(403, "Only administrators can add internal notes");
  }

  const filter = { ticketNumber: req.params.ticketNumber };
  if (role === "CUSTOMER") {
    filter.requester = id;
  } else if (role !== "PLATFORM_ADMIN") {
    throw new ApiError(403, "Administrator access is required");
  }

  const existingTicket = await Ticket.findOne(filter);
  if (!existingTicket) {
    throw new ApiError(404, "Ticket not found");
  }

  const addedAttachmentSize = attachments.reduce((size, attachment) => {
    const match = /;base64,([A-Za-z0-9+/]+={0,2})$/.exec(attachment.dataUrl);
    return size + (match ? Buffer.from(match[1], "base64").length : 0);
  }, 0);
  if (
    getTicketAttachmentSize(existingTicket) + addedAttachmentSize >
    MAX_TICKET_ATTACHMENT_SIZE
  ) {
    throw new ApiError(413, "This ticket has reached its 8 MB attachment limit");
  }

  const ticket = await Ticket.findOneAndUpdate(
    { _id: existingTicket._id },
    {
      $push: {
        messages: {
          authorId: id,
          authorName: name,
          authorEmail: email,
          authorRole: role,
          body: messageBody,
          isInternalNote,
          attachments,
        },
      },
    },
    { new: true, runValidators: true },
  );

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  const responseTicket = ticket.toObject();
  if (role === "CUSTOMER") {
    responseTicket.messages = (responseTicket.messages || []).filter(
      (message) => !message.isInternalNote,
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, responseTicket, "Ticket message added successfully"));
});

// ================ Delete a ticket ==========
const deleteTicket = asyncHandler(async (req, res) => {
  const ticketNumber = req.params.ticketNumber;
  const filter = { ticketNumber };

  if (req.authenticatedUser.role !== "PLATFORM_ADMIN") {
    filter.requester = req.authenticatedUser.id;
  }

  const ticket = await Ticket.findOneAndDelete(filter);

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, ticket, "Ticket deleted successfully"));
});

export {
  createTicket,
  deleteTicket,
  editTicket,
  getAllTickets,
  getMyTickets,
  getTicketSummary,
  getTodayTickets,
  getTodaysTickets,
  addTicketMessage,
  updateTicketStatus,
};