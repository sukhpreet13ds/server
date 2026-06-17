import { prisma } from '@/lib/prisma';
import { json, error, preflight, handler, requireAdmin } from '@/lib/http';

export const OPTIONS = preflight;

// Admin: list delivery quote requests (newest first).
export const GET = handler(async (request) => {
  requireAdmin(request);
  const quotes = await prisma.deliveryQuote.findMany({ orderBy: { createdAt: 'desc' } });
  const unread = quotes.filter((q) => !q.isRead).length;
  return json({ quotes, unread });
});

// Public: store a delivery-quote submission (delivery-quote.html mega form).
// `reinforcing` is an object of { "Product — Field label": value } for any
// supplies the visitor filled in.
export const POST = handler(async (request) => {
  const body = await request.json();
  if (!body.addressLine1 || !body.firstName || !body.email || !body.phoneNumber) {
    return error('Delivery address, first name, email and phone are required');
  }
  const quote = await prisma.deliveryQuote.create({
    data: {
      addressLine1: body.addressLine1,
      city: body.city ?? null,
      state: body.state ?? null,
      zipCode: body.zipCode ?? null,
      deliveryDate: body.deliveryDate ?? null,
      deliveryTime: body.deliveryTime ?? null,
      mixPsi: body.mixPsi ?? null,
      needFiber: body.needFiber ?? null,
      readyMixQty: body.readyMixQty != null ? String(body.readyMixQty) : null,
      needReinforcing: body.needReinforcing ?? null,
      reinforcing:
        body.reinforcing && Object.keys(body.reinforcing).length ? body.reinforcing : undefined,
      firstName: body.firstName,
      lastName: body.lastName ?? null,
      email: body.email,
      phoneNumber: body.phoneNumber,
      businessName: body.businessName ?? null,
      poNumber: body.poNumber ?? null,
      specialInstructions: body.specialInstructions ?? null,
    },
  });
  return json({ ok: true, id: quote.id }, { status: 201 });
});
