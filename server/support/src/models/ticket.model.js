import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    fileName: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    fileSize: {
      type: String,
    },
    fileType: {
      type: String,
      enum: ["image", "pdf", "log", "archive"],
    },
    mimeType: {
      type: String,
    },
    dataUrl: {
      type: String,
    },
    storageKey: {
      type: String,
      trim: true,
    },
    sizeBytes: {
      type: Number,
      min: 0,
    },
    uploadedAt: {
      type: String,
    },
    uploadedBy: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema(
  {
    authorId: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    authorRole: {
      type: String,
      enum: [
        "PLATFORM_ADMIN",
        "COMPANY_ADMIN",
        "SUPPORT_MANAGER",
        "SUPPORT_AGENT",
        "CUSTOMER",
      ],
      required: true,
    },
    body: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
    isInternalNote: {
      type: Boolean,
      default: false,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
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

    messages: {
      type: [messageSchema],
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
