import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Admin: list contact submissions (newest first).
export const GET = handler(async (request) => {
  requireAdmin(request);
  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const unread = submissions.filter((s) => !s.isRead).length;
  return json({ submissions, unread });
});

// Public: store a contact-form submission (contact-us.html).
export const POST = handler(async (request) => {
  const body = await request.json();
  if (!body.fullName || !body.phone || !body.email) {
    return error('fullName, phone and email are required');
  }
  const submission = await prisma.contactSubmission.create({
    data: {
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      service: body.service ?? null,
      message: body.message ?? null,
    },
  });
  return json({ ok: true, id: submission.id }, { status: 201 });
});
