import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute
const MAX_REQUESTS = 100; // requests per window

export async function rateLimit(req: NextRequest) {
  try {
    const ip = req.ip || 'anonymous';
    const key = `rate-limit:${ip}`;
    
    const current = await redis.get<number>(key) || 0;
    
    if (current > MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    await redis.pipeline()
      .incr(key)
      .expire(key, RATE_LIMIT_WINDOW)
      .exec();
      
    return NextResponse.next();
  } catch (error) {
    // If Redis fails, allow the request to proceed
    console.error('Rate limiting error:', error);
    return NextResponse.next();
  }
}
