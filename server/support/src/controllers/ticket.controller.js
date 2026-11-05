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

export { createTicket };