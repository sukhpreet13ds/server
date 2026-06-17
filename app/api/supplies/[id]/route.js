import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

export const GET = handler(async (request, ctx) => {
  const { id } = await ctx.params;
  const product = await prisma.supplyProduct.findUnique({
    where: { id: Number(id) },
    include: { fields: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!product) return error('Supply product not found', 404);
  return json(product);
});

// Admin: update a supply product. If `fields` is provided, replace them all.
export const PUT = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const productId = Number(id);
  const body = await request.json();

  await prisma.supplyProduct.update({
    where: { id: productId },
    data: {
      title: body.title,
      image: body.image,
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    },
  });

  if (Array.isArray(body.fields)) {
    await prisma.supplyProductField.deleteMany({ where: { productId } });
    for (let i = 0; i < body.fields.length; i++) {
      const f = body.fields[i];
      await prisma.supplyProductField.create({
        data: {
          productId,
          label: f.label,
          inputType: f.inputType === 'select' ? 'select' : 'number',
          placeholder: f.placeholder ?? null,
          helper: f.helper ?? null,
          options: Array.isArray(f.options) && f.options.length ? f.options : undefined,
          sortOrder: f.sortOrder ?? i,
        },
      });
    }
  }

  const updated = await prisma.supplyProduct.findUnique({
    where: { id: productId },
    include: { fields: { orderBy: { sortOrder: 'asc' } } },
  });
  return json(updated);
});

// Admin: delete a supply product (cascades to its fields).
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.supplyProduct.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
