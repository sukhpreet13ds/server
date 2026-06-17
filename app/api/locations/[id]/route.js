import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const location = await prisma.location.findUnique({ where: { id: Number(id) } });
  if (!location) return error('Location not found', 404);
  return json(location);
});

// Admin: update a location.
export const PUT = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const body = await request.json();
  const location = await prisma.location.update({
    where: { id: Number(id) },
    data: {
      city: body.city,
      badge: body.badge,
      badgeType: body.badgeType,
      address: body.address,
      hours: body.hours,
      serviceArea: body.serviceArea,
      phone: body.phone,
      mapEmbedUrl: body.mapEmbedUrl,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    },
  });
  return json(location);
});

// Admin: delete a location.
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.location.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
