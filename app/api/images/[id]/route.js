import { prisma } from '@/lib/prisma';
import { json, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Admin: delete a single project image.
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.projectImage.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
