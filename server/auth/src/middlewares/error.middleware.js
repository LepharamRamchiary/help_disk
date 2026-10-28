import { ApiError } from "../utils/ApiError.js";

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, "Route not found"));
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let error = err;

  if (!(error instanceof ApiError)) {
    if (error.type === "entity.parse.failed") {
      error = new ApiError(400, "Invalid JSON body");
    } else if (error.type === "entity.too.large") {
      error = new ApiError(413, "Request body is too large");
    } else {
      console.error("Unexpected error:", err);
      error = new ApiError(500, "Internal server error");
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.error("Error:", error.stack);
  }

  return res.status(error.statusCode).json({
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    errors: error.errors,
    data: null,
  });
};

export { notFoundHandler, errorHandler };
