import { prisma } from '@/lib/prisma';
import { json, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Admin: update a gallery photo (alt / visibility / order).
export const PUT = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const body = await request.json();
  const image = await prisma.galleryImage.update({
    where: { id: Number(id) },
    data: { url: body.url, alt: body.alt, sortOrder: body.sortOrder, isActive: body.isActive },
  });
  return json(image);
});

// Admin: delete a gallery photo.
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.galleryImage.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
