import type { Attachment } from '@/types/helpdesk';

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_BATCH_SIZE_BYTES = 6 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_BATCH = 5;

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.log': 'text/plain',
  '.txt': 'text/plain',
  '.har': 'application/json',
  '.xml': 'application/xml',
  '.json': 'application/json',
};

const ALLOWED_MIME_TYPES = new Set(Object.values(MIME_TYPES_BY_EXTENSION));

function getMimeType(file: File): string {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const fallback = MIME_TYPES_BY_EXTENSION[extension];
  const mimeType = file.type.toLowerCase();

  if (ALLOWED_MIME_TYPES.has(mimeType)) {
    return mimeType;
  }
  if (fallback) {
    return fallback;
  }
  throw new Error(`"${file.name}" is not a supported attachment type.`);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(`Could not read "${file.name}".`));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number): string {
  const kilobytes = Math.max(1, Math.round(size / 1024));
  return kilobytes >= 1024
    ? `${(kilobytes / 1024).toFixed(1)} MB`
    : `${kilobytes} KB`;
}

function getAttachmentSize(attachment: Attachment): number {
  const base64 = attachment.dataUrl?.split(',')[1];
  if (!base64) return 0;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function mergeAttachments(
  current: Attachment[],
  added: Attachment[]
): Attachment[] {
  const combined = [...current, ...added];
  if (combined.length > MAX_ATTACHMENTS_PER_BATCH) {
    throw new Error(`Attach no more than ${MAX_ATTACHMENTS_PER_BATCH} files at a time.`);
  }
  if (combined.reduce((size, item) => size + getAttachmentSize(item), 0) > MAX_BATCH_SIZE_BYTES) {
    throw new Error('Attachments must total 6 MB or less per upload.');
  }
  return combined;
}

export async function filesToAttachments(
  files: FileList | File[],
  uploadedBy: string
): Promise<Attachment[]> {
  const selectedFiles = Array.from(files);
  if (selectedFiles.length > MAX_ATTACHMENTS_PER_BATCH) {
    throw new Error(`Attach no more than ${MAX_ATTACHMENTS_PER_BATCH} files at a time.`);
  }

  let batchSize = 0;
  const normalizedFiles = selectedFiles.map((file) => {
    const mimeType = getMimeType(file);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`"${file.name}" exceeds the 4 MB per-file limit.`);
    }
    batchSize += file.size;
    if (batchSize > MAX_BATCH_SIZE_BYTES) {
      throw new Error('Attachments must total 6 MB or less per upload.');
    }
    return { file, mimeType };
  });

  return Promise.all(
    normalizedFiles.map(async ({ file, mimeType }, index) => ({
      id: `attachment-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: mimeType.startsWith('image/')
        ? 'image'
        : mimeType === 'application/pdf'
          ? 'pdf'
          : 'log',
      mimeType,
      dataUrl: await readFileAsDataUrl(file),
      uploadedAt: new Date().toISOString(),
      uploadedBy,
    }))
  );
}
