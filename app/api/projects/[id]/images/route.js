import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public: list a project's gallery images.
export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const images = await prisma.projectImage.findMany({
    where: { projectId: Number(id) },
    orderBy: { sortOrder: 'asc' },
  });
  return json(images);
});

// Admin: attach an image (already uploaded via /api/upload) to a project.
export const POST = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const body = await request.json();
  if (!body.url) return error('url is required');
  const image = await prisma.projectImage.create({
    data: {
      projectId: Number(id),
      url: body.url,
      alt: body.alt ?? null,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return json(image, { status: 201 });
});
