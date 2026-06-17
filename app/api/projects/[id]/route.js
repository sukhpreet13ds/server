import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public: a single project with images + subcategory (project-nested.html).
export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      subcategory: { select: { id: true, name: true, slug: true, categorySlug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!project) return error('Project not found', 404);
  return json(project);
});

// Admin: update a project.
export const PUT = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const body = await request.json();
  const project = await prisma.project.update({
    where: { id: Number(id) },
    data: {
      subcategoryId: body.subcategoryId !== undefined ? Number(body.subcategoryId) : undefined,
      title: body.title,
      description: body.description,
      tag: body.tag,
      year: body.year,
      jobName: body.jobName,
      location: body.location,
      projectSize: body.projectSize,
      thumbnail: body.thumbnail,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    },
  });
  return json(project);
});

// Admin: delete a project (cascades to its images).
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.project.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
