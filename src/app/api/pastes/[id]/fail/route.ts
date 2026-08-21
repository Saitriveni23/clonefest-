import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const { failed, burned } = await dbHelper.incrementFailedAttempts(id);

    return NextResponse.json({
      failed,
      burned
    });
  } catch (err: any) {
    console.error('Error reporting decryption failure:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
