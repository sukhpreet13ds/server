import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public/admin: list projects, filtered by subcategory (?subcategoryId=) or by
// fixed category (?category=slug). Admin (?all=1) includes inactive.
export const GET = handler(async (request) => {
  const { searchParams } = new URL(request.url);
  const subcategoryId = searchParams.get('subcategoryId');
  const category = searchParams.get('category');
  const includeInactive = searchParams.get('all') === '1';

  const where = {};
  if (!includeInactive) where.isActive = true;
  if (subcategoryId) where.subcategoryId = Number(subcategoryId);
  if (category) where.subcategory = { categorySlug: category };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      subcategory: { select: { id: true, name: true, slug: true, categorySlug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  });
  return json(projects);
});

// Admin: create a project under a subcategory.
export const POST = handler(async (request) => {
  requireAdmin(request);
  const body = await request.json();
  if (!body.subcategoryId || !body.title) {
    return error('subcategoryId and title are required');
  }
  const project = await prisma.project.create({
    data: {
      subcategoryId: Number(body.subcategoryId),
      title: body.title,
      description: body.description ?? null,
      tag: body.tag ?? null,
      year: body.year ?? null,
      jobName: body.jobName ?? null,
      location: body.location ?? null,
      projectSize: body.projectSize ?? null,
      thumbnail: body.thumbnail ?? null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  });
  return json(project, { status: 201 });
});
