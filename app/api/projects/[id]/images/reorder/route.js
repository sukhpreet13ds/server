import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Admin: set a project's gallery image order. Body: { ids: [id, id, ...] }.
export const PUT = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const projectId = Number(id);
  const { ids } = await request.json();
  if (!Array.isArray(ids)) return error('ids array required');
  await prisma.$transaction(
    ids.map((imgId, i) =>
      prisma.projectImage.update({
        where: { id: Number(imgId) },
        data: { sortOrder: i },
      })
    )
  );
  const images = await prisma.projectImage.findMany({
    where: { projectId },
    orderBy: { sortOrder: 'asc' },
  });
  return json(images);
});
