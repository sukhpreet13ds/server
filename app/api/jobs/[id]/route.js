import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public: a single job (career-view.html).
export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const job = await prisma.job.findUnique({ where: { id: Number(id) } });
  if (!job) return error('Job not found', 404);
  return json(job);
});

// Admin: update a job.
export const PUT = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const body = await request.json();
  const job = await prisma.job.update({
    where: { id: Number(id) },
    data: {
      title: body.title,
      category: body.category,
      location: body.location,
      employmentType: body.employmentType,
      shortDescription: body.shortDescription,
      fullDescription: body.fullDescription,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    },
  });
  return json(job);
});

// Admin: delete a job.
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.job.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
