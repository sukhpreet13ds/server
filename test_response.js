import { NextResponse } from 'next/server';
const res = NextResponse.json({ ok: true });
console.log("Is Response?", res instanceof Response);
