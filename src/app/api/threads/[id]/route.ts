import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const thread = await dbHelper.getThread(id);

    if (!thread) {
      return NextResponse.json(
        { error: 'Encrypted thread not found or expired.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: thread.id,
      messages_json: thread.messages_json,
      created_at: thread.created_at,
      expires_at: thread.expires_at,
    });
  } catch (error: any) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { messages_json } = body;

    if (!messages_json) {
      return NextResponse.json(
        { error: 'Encrypted messages payload is required.' },
        { status: 400 }
      );
    }

    const updated = await dbHelper.updateThread(id, messages_json);

    if (!updated) {
      return NextResponse.json(
        { error: 'Thread not found, expired, or could not be updated.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating thread:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
