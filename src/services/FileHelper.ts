import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';
import { Attachment } from '../types';

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed'
};

export function getFileExtension(fileName: string): string {
  if (!fileName || !fileName.includes('.')) return '';
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function resolveMimeType(fileName: string, fallbackType?: string): string {
  const ext = getFileExtension(fileName);
  if (ext && MIME_MAP[ext]) {
    return MIME_MAP[ext];
  }
  return fallbackType || 'application/octet-stream';
}

export function isImageAttachment(att: Attachment): boolean {
  const type = (att.fileType || '').toLowerCase();
  const ext = getFileExtension(att.fileName);
  return type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);
}

export function isPdfAttachment(att: Attachment): boolean {
  const type = (att.fileType || '').toLowerCase();
  const ext = getFileExtension(att.fileName);
  return type.includes('pdf') || ext === 'pdf';
}

export function getSafeAsciiFileName(id: string, originalName: string): string {
  const ext = getFileExtension(originalName) || 'bin';
  const cleanId = id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'file';
  return `tabrizu_${cleanId}.${ext}`;
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || '';
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

/**
 * Streams a binary blob into the native filesystem cache in low-memory chunks.
 * Peak RAM usage is bounded below 1.5MB regardless of file size (even for 100MB+ PDFs).
 * Prevents V8 heap bloat, Capacitor bridge IPC overflow, and Android OOM crashes.
 */
export async function streamBlobToNativeCacheInChunks(
  safeFileName: string,
  blob: Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  // 1. Check if the file is already cached with the exact file size (Instant Cache Hit)
  try {
    const stat = await Filesystem.stat({
      path: safeFileName,
      directory: Directory.Cache
    });
    if (stat && stat.size === blob.size) {
      if (onProgress) onProgress(100);
      const uriResult = await Filesystem.getUri({
        path: safeFileName,
        directory: Directory.Cache
      });
      return uriResult.uri;
    }
  } catch {
    // Cache miss: file does not exist yet in cache, proceed to streaming
  }

  // 2. Chunked writing parameters
  // 768 KB per chunk (786,432 bytes: divisible by 3, zero base64 padding overhead, < 1.1MB IPC payload)
  const CHUNK_SIZE = 768 * 1024;
  const totalSize = blob.size;
  let offset = 0;
  let isFirst = true;

  while (offset < totalSize) {
    const end = Math.min(offset + CHUNK_SIZE, totalSize);
    const chunkBlob = blob.slice(offset, end);
    const chunkBase64 = await blobToBase64(chunkBlob);

    if (isFirst) {
      await Filesystem.writeFile({
        path: safeFileName,
        data: chunkBase64,
        directory: Directory.Cache,
        recursive: true
      });
      isFirst = false;
    } else {
      await Filesystem.appendFile({
        path: safeFileName,
        data: chunkBase64,
        directory: Directory.Cache
      });
    }

    offset = end;
    if (onProgress && totalSize > 0) {
      const pct = Math.min(99, Math.round((offset / totalSize) * 100));
      onProgress(pct);
    }
  }

  if (onProgress) onProgress(100);

  const finalUri = await Filesystem.getUri({
    path: safeFileName,
    directory: Directory.Cache
  });

  return finalUri.uri;
}

export async function openAttachmentSafely(
  att: Attachment, 
  blob: Blob,
  onOpenInAppPreview?: (previewData: { url: string; name: string; type: string }) => void,
  onProgress?: (percent: number) => void
): Promise<void> {
  const isImage = isImageAttachment(att);
  const isPdf = isPdfAttachment(att);
  const mimeType = resolveMimeType(att.fileName, att.fileType);

  // 1. If it's an image and in-app preview is available, preview in-app (0ms, 0 crash risk)
  if (isImage && onOpenInAppPreview) {
    const objectUrl = URL.createObjectURL(blob);
    onOpenInAppPreview({
      url: objectUrl,
      name: att.fileName,
      type: mimeType
    });
    // Caller is responsible for revoking on close; revoke here as a safety
    // net in case the preview modal never mounts or errors out.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    return;
  }

  // 2. If running in Web / Desktop / Localhost
  if (!Capacitor.isNativePlatform()) {
    const objectUrl = URL.createObjectURL(blob);
    if (isPdf) {
      const tab = window.open(objectUrl, '_blank');
      if (!tab) {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = att.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = att.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    return;
  }

  // 3. If running on Native Android/iOS
  try {
    const safeName = getSafeAsciiFileName(att.id, att.fileName);
    
    // Stream blob into native cache in safe 768KB chunks with bounded memory
    const fileUri = await streamBlobToNativeCacheInChunks(safeName, blob, onProgress);

    // Open file using FileOpener (with fallback to default open if chooser fails)
    try {
      await FileOpener.open({
        filePath: fileUri,
        contentType: mimeType,
        openWithDefault: false
      });
    } catch (openerErr) {
      console.warn('FileOpener with chooser failed, falling back to default:', openerErr);
      await FileOpener.open({
        filePath: fileUri,
        contentType: mimeType,
        openWithDefault: true
      });
    }
  } catch (err) {
    console.error('FileOpener error:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('ActivityNotFound') || errMsg.includes('No Activity found')) {
      alert('برنامه مناسبی برای باز کردن این فایل (مانند PDF‌خوان) روی گوشی شما یافت نشد.');
    } else {
      alert('امکان باز کردن فایل با برنامه‌های پیش‌فرض گوشی وجود ندارد.');
    }
  }
}
