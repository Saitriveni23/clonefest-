import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

// Simple 6-digit OTP generator
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory OTP store { pasteId: { otp, expires } }
const otpStore: Record<string, { otp: string; expires: number; verified: boolean }> = {};

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const paste = await dbHelper.getPasteMetadata(id);
    if (!paste) {
      return NextResponse.json({ error: 'Paste not found.' }, { status: 404 });
    }

    // Generate OTP and store it for 10 minutes
    const otp = generateOtp();
    otpStore[id] = {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 min
      verified: false,
    };

    // In a real app, you would SMS/email the OTP here.
    // For demo purposes, we return it in the response (with a "simulated" header).
    console.log(`[DEMO OTP] Paste ${id}: OTP = ${otp}`);

    return NextResponse.json({
      success: true,
      demo_otp: otp, // Visible in response for hackathon demo
      message: 'OTP sent (simulated). Check console for OTP value.',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { otp } = await req.json();

    const record = otpStore[id];
    if (!record) {
      return NextResponse.json({ error: 'No OTP issued for this paste.' }, { status: 400 });
    }

    if (Date.now() > record.expires) {
      delete otpStore[id];
      return NextResponse.json({ error: 'OTP has expired. Request a new one.' }, { status: 400 });
    }

    if (record.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect OTP. Try again.' }, { status: 401 });
    }

    record.verified = true;
    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const record = otpStore[id];
  const verified = record?.verified === true && Date.now() < record.expires;
  return NextResponse.json({ verified });
}
