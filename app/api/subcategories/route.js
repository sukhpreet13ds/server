import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

const CATEGORIES = ['commercial-concrete', 'residential-concrete'];

// Public: subcategories for a fixed category (?category=slug), each with its
// active projects (used to render the grouped project-view.html). Admin (?all=1)
// sees inactive ones too.
export const GET = handler(async (request) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const includeInactive = searchParams.get('all') === '1';

  const where = {};
  if (category) where.categorySlug = category;
  if (!includeInactive) where.isActive = true;

  const subcategories = await prisma.projectSubcategory.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      projects: {
        where: includeInactive ? {} : { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { images: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });
  return json(subcategories);
});

// Admin: create a subcategory under one of the fixed categories.
export const POST = handler(async (request) => {
  requireAdmin(request);
  const body = await request.json();
  if (!body.name || !body.slug || !body.categorySlug) {
    return error('name, slug and categorySlug are required');
  }
  if (!CATEGORIES.includes(body.categorySlug)) {
    return error('categorySlug must be one of: ' + CATEGORIES.join(', '));
  }
  const sub = await prisma.projectSubcategory.create({
    data: {
      categorySlug: body.categorySlug,
      name: body.name,
      slug: body.slug,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  });
  return json(sub, { status: 201 });
});
