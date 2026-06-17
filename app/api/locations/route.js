import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public: list active locations (contact-us.html boxes + map).
export const GET = handler(async () => {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return json(locations);
});

// Admin: create a location.
export const POST = handler(async (request) => {
  requireAdmin(request);
  const body = await request.json();
  if (!body.city || !body.address || !body.mapEmbedUrl) {
    return error('city, address and mapEmbedUrl are required');
  }
  const location = await prisma.location.create({
    data: {
      city: body.city,
      badge: body.badge ?? null,
      badgeType: body.badgeType ?? null,
      address: body.address,
      hours: body.hours ?? null,
      serviceArea: body.serviceArea ?? null,
      phone: body.phone ?? null,
      mapEmbedUrl: body.mapEmbedUrl,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  });
  return json(location, { status: 201 });
});
