import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Public: active supply products with their fields (delivery-quote.html).
// Admin (?all=1) includes inactive.
export const GET = handler(async (request) => {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === '1';
  const products = await prisma.supplyProduct.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { fields: { orderBy: { sortOrder: 'asc' } } },
  });
  return json(products);
});

// Admin: create a supply product with its fields.
export const POST = handler(async (request) => {
  requireAdmin(request);
  const body = await request.json();
  if (!body.title) return error('title is required');
  const product = await prisma.supplyProduct.create({
    data: {
      title: body.title,
      image: body.image ?? null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
      fields: {
        create: (body.fields || []).map((f, i) => ({
          label: f.label,
          inputType: f.inputType === 'select' ? 'select' : 'number',
          placeholder: f.placeholder ?? null,
          helper: f.helper ?? null,
          options: Array.isArray(f.options) && f.options.length ? f.options : undefined,
          sortOrder: f.sortOrder ?? i,
        })),
      },
    },
    include: { fields: { orderBy: { sortOrder: 'asc' } } },
  });
  return json(product, { status: 201 });
});
