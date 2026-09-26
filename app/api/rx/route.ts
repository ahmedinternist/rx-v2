import { NextResponse } from 'next/server';

const RETENTION_DAYS = 60;
const RETENTION_SECONDS = RETENTION_DAYS * 24 * 60 * 60;

function isAuthorized(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  const validKey = process.env.RX_API_SECRET;
  return Boolean(validKey && apiKey === validKey);
}

function redisSettings() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const redis = redisSettings();
  if (!redis) {
    return NextResponse.json(
      { error: 'Cloud storage is not configured' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const response = await fetch(`${redis.url}/ping`, {
      headers: { Authorization: `Bearer ${redis.token}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error('Database health check failed');
    }
    const body = await response.json();
    if (String(body?.result || '').toUpperCase() !== 'PONG') {
      throw new Error('Unexpected database health response');
    }
    return NextResponse.json(
      { status: 'ok', redis: 'ok', retentionDays: RETENTION_DAYS },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Cloud storage is unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. API Key Authorization Check
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing API key' }, { status: 401 });
    }

    const payload = await request.json();

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Payload cannot be empty' }, { status: 400 });
    }

    // 2. Generate 8-character unique ID
    const rxId = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

    // 3. Save to Redis via REST API
    const redis = redisSettings();
    if (!redis) {
      return NextResponse.json({ error: 'Cloud storage is not configured' }, { status: 503 });
    }

    const response = await fetch(`${redis.url}/set/rx:${rxId}/${encodeURIComponent(JSON.stringify(payload))}?EX=${RETENTION_SECONDS}`, {
      headers: {
        Authorization: `Bearer ${redis.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Database write failed');
    }

    // 4. Formulate viewer URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rx-v2.vercel.app';
    const viewerUrl = `${baseUrl}/p/${rxId}`;

    return NextResponse.json({ rxId, url: viewerUrl }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
