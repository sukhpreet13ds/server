import { readFile, stat } from 'fs/promises';
import path from 'path';
import { corsHeaders } from '@/lib/http';

// Serves uploaded files from /public/uploads via a dynamic route. Next's static
// public serving does NOT pick up files written after `next build`, so user
// uploads must be streamed by a handler to work in production.
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
};

export async function GET(request, ctx) {
  const { path: segments } = await ctx.params;
  // Block path traversal — only allow a flat filename inside UPLOAD_DIR.
  const name = path.basename((segments || []).join('/'));
  const filePath = path.join(UPLOAD_DIR, name);
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return new Response('Not found', { status: 404 });
  }
  try {
    await stat(filePath);
    const data = await readFile(filePath);
    const ext = path.extname(name).toLowerCase();
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ...corsHeaders(),
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
