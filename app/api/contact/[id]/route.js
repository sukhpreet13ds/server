import { prisma } from '@/lib/prisma';
import { json, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Admin: mark a submission read/unread.
export const PATCH = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  const body = await request.json();
  const submission = await prisma.contactSubmission.update({
    where: { id: Number(id) },
    data: { isRead: body.isRead ?? true },
  });
  return json(submission);
});

// Admin: delete a submission.
export const DELETE = handler(async (request, ctx) => {
  requireAdmin(request);
  const { id } = await ctx.params;
  await prisma.contactSubmission.delete({ where: { id: Number(id) } });
  return json({ ok: true });
});
