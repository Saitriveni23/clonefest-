import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/pastes/[id]/scan
 * Called when a QR code is scanned. Increments scan_count.
 * If scan_limit is reached, the paste is burned (deleted).
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await dbHelper.incrementScanCount(id);

    return NextResponse.json({
      success: true,
      burned: result.burned,
      scan_count: result.scan_count,
      scan_limit: result.scan_limit,
      message: result.burned
        ? `QR burned after ${result.scan_count} scan(s). Paste permanently destroyed.`
        : `Scan ${result.scan_count} of ${result.scan_limit || '∞'}.`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
