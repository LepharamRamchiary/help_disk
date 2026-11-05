import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    subject: {
      type: String,
      required: [true, "Ticket subject is required"],
      trim: true,
      maxlength: 200,
    },
    requester: {
      type: String,
      required: true,
    },

    requesterName: {
      type: String,
      required: true,
      trim: true,
    },

    requesterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Support category is required"],
      trim: true,
      maxlength: 100,
    },

    priority: {
      type: String,
      required: [true, "Priority level is required"],
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    description: {
      type: String,
      required: [true, "Ticket description is required"],
      trim: true,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Pending", "Resolved", "Closed"],
      default: "Open",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const Ticket = mongoose.model("Ticket", ticketSchema);
