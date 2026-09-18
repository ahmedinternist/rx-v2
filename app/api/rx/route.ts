import { NextResponse } from 'next/server';

const SEVEN_DAYS = 604800;

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Payload cannot be empty' }, { status: 400 });
    }

    // 1. Generate an 8-character unique ID
    const rxId = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

    // 2. Save into Redis via your existing REST API (SET key value EX seconds)
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

    // 3. Formulate viewer URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.vercel.app';
    const viewerUrl = `${baseUrl}/p/${rxId}`;

    return NextResponse.json({ rxId, url: viewerUrl }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
