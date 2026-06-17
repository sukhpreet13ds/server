import { NextResponse } from 'next/server';
import { getAdminFromRequest } from './auth';

const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || 'http://localhost:5173';

// CORS headers so the Vite admin SPA (different origin) can call the API.
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ADMIN_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function json(data, init = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...corsHeaders(), ...(init.headers || {}) },
  });
}

export function error(message, status = 400) {
  return json({ error: message }, { status });
}

// Preflight handler — re-export as OPTIONS from any route that needs it.
export function preflight() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// Guard for admin-only routes. Returns the admin payload, or throws a Response.
export function requireAdmin(request) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    throw error('Unauthorized', 401);
  }
  return admin;
}

// Wrap an async handler so thrown Responses (e.g. from requireAdmin) and
// unexpected errors both return clean JSON with CORS headers.
export function handler(fn) {
  return async (request, ctx) => {
    try {
      return await fn(request, ctx);
    } catch (err) {
      if (err instanceof Response || (err && typeof err.status === 'number')) return err;
      console.error('API error:', err);
      return error('Internal server error', 500);
    }
  };
}
