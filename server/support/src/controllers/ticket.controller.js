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
  const ticket = await Ticket.create({
    ticketNumber: `HD-${Date.now()}-${randomBytes(6).toString("hex").toUpperCase()}`,
    subject: normalizedSubject,
    description: normalizedDescription,
    category: normalizedCategory,
    priority: PRIORITIES[priority],
    requester: id,
    requesterName: name.trim(),
    requesterEmail: email.trim().toLowerCase(),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, ticket, "Ticket created successfully"));
});

const getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, tickets, "Tickets retrieved successfully"));
});

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

export { createTicket, editTicket, getAllTickets };