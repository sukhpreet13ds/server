import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public: list active jobs, optionally filtered by category (?category=labor).
// "all" / empty returns everything. Admins (?all=1) see inactive too.
export const GET = handler(async (request) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const includeInactive = searchParams.get('all') === '1';

  const where = {};
  if (!includeInactive) where.isActive = true;
  if (category && category !== 'all') where.category = category;

  const jobs = await prisma.job.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return json(jobs);
});

// Admin: create a job posting.
export const POST = handler(async (request) => {
  requireAdmin(request);
  const body = await request.json();
  if (!body.title || !body.category || !body.shortDescription) {
    return error('title, category and shortDescription are required');
  }
  const job = await prisma.job.create({
    data: {
      title: body.title,
      category: body.category,
      location: body.location ?? null,
      employmentType: body.employmentType ?? null,
      shortDescription: body.shortDescription,
      fullDescription: body.fullDescription ?? null,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return json(job, { status: 201 });
});
