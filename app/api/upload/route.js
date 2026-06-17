import { saveUpload } from '@/lib/upload';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Admin: upload one image file (multipart/form-data, field "file").
// Saves to /public/uploads and returns { url } for use in create/update calls.
export const POST = handler(async (request) => {
  requireAdmin(request);
  let form;
  try {
    const bodyBuffer = await request.arrayBuffer();
    const newReq = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: bodyBuffer,
    });
    form = await newReq.formData();
  } catch (e) {
    return error('Invalid form data', 400);
  }
  const file = form.get('file');
  if (!file) return error('No file provided');
  try {
    const url = await saveUpload(file);
    return json({ url }, { status: 201 });
  } catch (e) {
    return error(e.message || 'Upload failed', 400);
  }
});
