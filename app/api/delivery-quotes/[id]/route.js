import { prisma } from '@/lib/prisma';
import { json, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Admin: mark a quote read/unread.
export const PATCH = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const body = await request.json();
  const quote = await prisma.deliveryQuote.update({
    where: { id: Number(id) },
    data: { isRead: body.isRead ?? true },
  });
  return json(quote);
});

// Admin: delete a quote.
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.deliveryQuote.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
