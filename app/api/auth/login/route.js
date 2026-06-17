import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth';
import { json, error, preflight, handler } from '@/lib/http';

export const OPTIONS = preflight;

export const POST = handler(async (request) => {
  const { email, password } = await request.json();
  if (!email || !password) return error('Email and password are required');

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return error('Invalid credentials', 401);

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return error('Invalid credentials', 401);

  const token = signToken({ id: admin.id, email: admin.email });
  return json({ token, admin: { id: admin.id, email: admin.email } });
});
