import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';
import crypto from 'crypto';

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { check_in_key } = body;

    if (!check_in_key) {
      return NextResponse.json(
        { error: 'Check-in key is required.' },
        { status: 400 }
      );
    }

    const metadata = await dbHelper.getPasteMetadata(id);
    if (!metadata || metadata.is_dead_man !== 1) {
      return NextResponse.json(
        { error: 'Dead man switch not found or paste does not exist.' },
        { status: 404 }
      );
    }

    const hash = sha256(check_in_key);
    if (metadata.check_in_key_hash !== hash) {
      return NextResponse.json(
        { error: 'Invalid check-in key.' },
        { status: 401 }
      );
    }

    if (!metadata.check_in_interval) {
      return NextResponse.json(
        { error: 'Invalid check-in interval config.' },
        { status: 400 }
      );
    }

    const nextCheckInDue = await dbHelper.checkInDeadMan(id, metadata.check_in_interval);

    return NextResponse.json({
      success: true,
      next_check_in_due: nextCheckInDue,
    });
  } catch (error: any) {
    console.error('Error checking in dead man:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
