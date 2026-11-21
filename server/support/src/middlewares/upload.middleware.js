import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_BATCH_SIZE = 6 * 1024 * 1024;
const MAX_FILE_COUNT = 5;
const UPLOAD_DIRECTORY = fileURLToPath(
  new URL("../../uploads/", import.meta.url),
);

const EXTENSIONS_BY_MIME_TYPE = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "application/json": ".json",
  "application/xml": ".xml",
  "text/xml": ".xml",
};

const isValidFileContent = (mimeType, buffer) => {
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  }
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/gif") {
    return buffer.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/) !== null;
  }
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }
  return !buffer.includes(0);
};

const removeUploadedFiles = async (files = []) => {
  const results = await Promise.allSettled(
    files.map((file) => unlink(file.path)),
  );
  const failure = results.find(
    (result) =>
      result.status === "rejected" && result.reason?.code !== "ENOENT",
  );
  if (failure) {
    throw failure.reason;
  }
};

const removeStorageKeys = async (keys) => {
  const files = keys.map((storageKey) => {
    if (!/^[a-f0-9]{32}\.(png|jpg|gif|webp|pdf|txt|json|xml)$/.test(storageKey)) {
      throw new ApiError(400, "An attachment has an invalid storage key");
    }
    return { path: join(UPLOAD_DIRECTORY, storageKey) };
  });
  await removeUploadedFiles(
    files,
  );
};

const makeStorageKey = (mimeType) => {
  const extension = EXTENSIONS_BY_MIME_TYPE[mimeType];
  if (!extension) {
    throw new ApiError(400, "Unsupported attachment type");
  }
  return `${randomBytes(16).toString("hex")}${extension}`;
};

const validateDataUrlAttachment = (attachment) => {
  const mimeType =
    typeof attachment.mimeType === "string" ? attachment.mimeType : "";
  const dataUrl =
    typeof attachment.dataUrl === "string" ? attachment.dataUrl : "";
  const match =
    /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      dataUrl,
    );

  if (!match || match[1] !== mimeType || !EXTENSIONS_BY_MIME_TYPE[mimeType]) {
    throw new ApiError(400, "An existing attachment has invalid file data");
  }

  const contents = Buffer.from(match[2], "base64");
  if (
    contents.length === 0 ||
    contents.length > MAX_FILE_SIZE ||
    contents.toString("base64") !== match[2] ||
    !isValidFileContent(mimeType, contents)
  ) {
    throw new ApiError(400, "An existing attachment has invalid file data");
  }

  return { mimeType, contents };
};

const saveLegacyAttachments = async (ticket) => {
  const attachments = [
    ...(ticket.attachments || []),
    ...(ticket.messages || []).flatMap((message) => message.attachments || []),
  ];
  const newStorageKeys = [];

  try {
    for (const attachment of attachments) {
      if (attachment.storageKey || typeof attachment.dataUrl !== "string") {
        continue;
      }

      const { mimeType, contents } = validateDataUrlAttachment(attachment);
      const storageKey = makeStorageKey(mimeType);
      await mkdir(UPLOAD_DIRECTORY, { recursive: true });
      await writeFile(join(UPLOAD_DIRECTORY, storageKey), contents, { flag: "wx" });
      newStorageKeys.push(storageKey);
      attachment.storageKey = storageKey;
      attachment.sizeBytes = contents.length;
      attachment.dataUrl = undefined;
    }

    if (newStorageKeys.length > 0) {
      await ticket.save({ timestamps: false });
    }
  } catch (error) {
    await removeStorageKeys(newStorageKeys);
    throw error;
  }
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    mkdir(UPLOAD_DIRECTORY, { recursive: true })
      .then(() => callback(null, UPLOAD_DIRECTORY))
      .catch(callback);
  },
  filename: (req, file, callback) => {
    try {
      callback(null, makeStorageKey(file.mimetype));
    } catch (error) {
      callback(error);
    }
  },
});

const multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILE_COUNT,
  },
  fileFilter: (req, file, callback) => {
    if (!Object.hasOwn(EXTENSIONS_BY_MIME_TYPE, file.mimetype)) {
      callback(new ApiError(400, "Unsupported attachment type"));
      return;
    }
    callback(null, true);
  },
});

const validateUploadedFiles = async (files) => {
  let batchSize = 0;
  for (const file of files) {
    batchSize += file.size;
    if (batchSize > MAX_BATCH_SIZE) {
      throw new ApiError(413, "Attachments must total 6 MB or less per upload");
    }
    const contents = await readFile(file.path);
    if (!isValidFileContent(file.mimetype, contents)) {
      throw new ApiError(
        400,
        `"${file.originalname}" is not a valid ${file.mimetype} file`,
      );
    }
  }
};

const receiveAttachments = (req, res, next) => {
  multerUpload.array("attachments", MAX_FILE_COUNT)(req, res, (error) => {
    if (error) {
      const uploadError =
        error instanceof multer.MulterError
          ? error.code === "LIMIT_FILE_SIZE"
            ? new ApiError(413, "Each attachment must be 4 MB or smaller")
            : new ApiError(400, "Too many or invalid attachments")
          : error;
      removeUploadedFiles(req.files || [])
        .then(() => next(uploadError))
        .catch(next);
      return;
    }

    validateUploadedFiles(req.files || [])
      .then(() => next())
      .catch((validationError) => {
        removeUploadedFiles(req.files || [])
          .then(() => next(validationError))
          .catch(next);
      });
  });
};

const cleanupFailedUploads = (req, res, next) => {
  res.once("finish", () => {
    if (res.statusCode < 400) {
      return;
    }
    removeUploadedFiles(req.files || []).catch((error) => {
      console.error("Could not remove rejected ticket attachments:", error);
    });
  });
  next();
};

export {
  cleanupFailedUploads,
  receiveAttachments,
  removeUploadedFiles,
  saveLegacyAttachments,
  UPLOAD_DIRECTORY,
};
