/**
 * Supabase Storage Client Service
 * 
 * Provides unified helper functions to upload photos (base64 Data URIs or Files),
 * videos, and audio messages directly to the Supabase Storage 'aura-media' bucket.
 */

export interface UploadResult {
  success: boolean;
  url: string;
  path?: string;
  error?: string;
}

/**
 * Upload a Base64 Data URI image to Supabase Storage.
 * Returns the public CDN URL of the uploaded image.
 */
export async function uploadDataUri(
  dataUri: string,
  folder: 'profiles' | 'videos' | 'audio' | 'lounge' = 'profiles',
  filename?: string
): Promise<string> {
  // If already an HTTP/HTTPS URL, return as-is
  if (dataUri.startsWith('http://') || dataUri.startsWith('https://')) {
    return dataUri;
  }

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dataUri,
      folder,
      filename,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const result: UploadResult = await response.json();
  if (!result.success || !result.url) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.url;
}

/**
 * Upload a File or Blob (e.g. video, audio recording) to Supabase Storage.
 * Returns the public CDN URL of the uploaded media file.
 */
export async function uploadMediaFile(
  fileOrBlob: File | Blob,
  folder: 'profiles' | 'videos' | 'audio' | 'lounge' = 'profiles',
  filename?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', fileOrBlob);
  formData.append('folder', folder);
  if (filename) {
    formData.append('filename', filename);
  }

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const result: UploadResult = await response.json();
  if (!result.success || !result.url) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.url;
}
