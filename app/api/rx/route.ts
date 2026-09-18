import { NextResponse } from 'next/server';

const SEVEN_DAYS = 604800;

export async function POST(request: Request) {
  try {
    // 1. API Key Authorization Check
    const apiKey = request.headers.get('x-api-key');
    const validKey = process.env.RX_API_SECRET;

    if (!validKey || apiKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing API key' }, { status: 401 });
    }

    const payload = await request.json();

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Payload cannot be empty' }, { status: 400 });
    }

    // 2. Generate 8-character unique ID
    const rxId = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

    // 3. Save to Redis via REST API
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

    const response = await fetch(`${redisUrl}/set/rx:${rxId}/${encodeURIComponent(JSON.stringify(payload))}?EX=${SEVEN_DAYS}`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
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
