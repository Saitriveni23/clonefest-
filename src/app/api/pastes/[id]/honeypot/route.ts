import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

// In-memory honeypot alert log
const honeypotAlerts: Record<string, Array<{ ip: string; ua: string; time: number }>> = {};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Log the access attempt
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '0.0.0.0';
    const ua = req.headers.get('user-agent') || 'Unknown';

    if (!honeypotAlerts[id]) honeypotAlerts[id] = [];
    honeypotAlerts[id].push({ ip, ua, time: Date.now() });
    
    console.log(`[HONEYPOT TRAP] Paste ${id} accessed from IP: ${ip}`);

    // Return a convincing fake "active" paste response
    return NextResponse.json({
      id,
      status: 'active',
      ciphertext: 'DECOY_PAYLOAD_DO_NOT_DECRYPT',
      iv: 'honeypot-iv',
      created_at: Date.now() - 3600000,
      expires_at: null,
      burn_after_read: false,
      password_protected: false,
      view_count: 0,
      is_honeypot: true,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  // Return alerts for the real manage panel
  const { id } = await params;
  return NextResponse.json({ alerts: honeypotAlerts[id] || [] });
}
