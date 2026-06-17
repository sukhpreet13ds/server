import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Admin: set gallery photo order. Body: { ids: [id, id, ...] } in desired order.
export const PUT = handler(async (request) => {
  requireAdmin(request);
  const { ids } = await request.json();
  if (!Array.isArray(ids)) return error('ids array required');
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.galleryImage.update({ where: { id: Number(id) }, data: { sortOrder: i } })
    )
  );
  return json({ ok: true });
});
