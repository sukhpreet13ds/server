import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public: active gallery photos in display order. Admin (?all=1) includes hidden.
export const GET = handler(async (request) => {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === '1';
  const images = await prisma.galleryImage.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return json(images);
});

// Admin: add a gallery photo (appended to the end).
export const POST = handler(async (request) => {
  requireAdmin(request);
  const body = await request.json();
  if (!body.url) return error('url is required');
  const count = await prisma.galleryImage.count();
  const image = await prisma.galleryImage.create({
    data: {
      url: body.url,
      alt: body.alt ?? 'Gallery Image',
      sortOrder: body.sortOrder ?? count,
      isActive: body.isActive ?? true,
    },
  });
  return json(image, { status: 201 });
});
