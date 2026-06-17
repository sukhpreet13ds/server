import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const sub = await prisma.projectSubcategory.findUnique({
    where: { id: Number(id) },
    include: { projects: { orderBy: { sortOrder: 'asc' }, include: { images: true } } },
  });
  if (!sub) return error('Subcategory not found', 404);
  return json(sub);
});

// Admin: update a subcategory.
export const PUT = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const body = await request.json();
  const sub = await prisma.projectSubcategory.update({
    where: { id: Number(id) },
    data: {
      categorySlug: body.categorySlug,
      name: body.name,
      slug: body.slug,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    },
  });
  return json(sub);
});

// Admin: delete a subcategory (cascades to its projects + images).
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.projectSubcategory.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
