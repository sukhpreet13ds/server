import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

// Cloudinary is used when configured (CLOUDINARY_URL, or the three vars).
const useCloudinary = !!(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET)
);
if (useCloudinary && !process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Saves a File (from request.formData()) and returns its public URL.
//  - With Cloudinary configured: uploads there and returns the secure CDN URL.
//  - Otherwise: writes to /public/uploads and returns a relative URL served by
//    the /api/uploads route (fine for local dev / single-server hosting).
export async function saveUpload(file) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('No file provided');
  }
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Unsupported file type');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    throw new Error('File too large (max 8MB)');
  }

  if (useCloudinary) {
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
    const res = await cloudinary.uploader.upload(dataUri, {
      folder: 'delzotto',
      resource_type: 'image',
    });
    return res.secure_url; // absolute https URL
  }

  // Local fallback — writable disk only (local dev or a VPS, NOT serverless).
  const rand = Math.random().toString(36).slice(2, 8);
  const stamp = `${process.hrtime.bigint().toString(36)}-${rand}`;
  const ext = EXT[file.type] || path.extname(file.name || '') || '';
  const filename = `${stamp}${ext}`;
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  } catch (err) {
    // Netlify/Lambda run on a read-only filesystem, so disk writes fail with
    // EROFS (or EACCES on some hosts). Surface an actionable message instead of
    // the raw fs error — the real fix is to configure Cloudinary in production.
    if (err && (err.code === 'EROFS' || err.code === 'EACCES')) {
      throw new Error(
        'Image storage is not configured for this host: the server filesystem is ' +
          'read-only (Netlify/Lambda). Set CLOUDINARY_URL in the deployment ' +
          'environment, then redeploy, to enable uploads.'
      );
    }
    throw err;
  }
  return `/api/uploads/${filename}`;
}
