const { NextResponse } = require('next/server');
const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
console.log(typeof res.status === 'number');
