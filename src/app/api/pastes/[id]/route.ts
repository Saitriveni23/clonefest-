import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';
import crypto from 'crypto';

// Helper: Calculate SHA-256 hash of a string
function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const manageKey = searchParams.get('manageKey');

    // If manageKey is provided, return metadata safely (for the sender panel)
    if (manageKey) {
      const metadata = dbHelper.getPasteMetadata(id);
      if (!metadata) {
        return NextResponse.json(
          { error: 'Paste not found or has expired.' },
          { status: 404 }
        );
      }

      const hash = sha256(manageKey);

      if (metadata.duress_key_hash === hash) {
        // Trigger silent coercion self-destruct!
        dbHelper.deletePaste(id);
        return NextResponse.json({
          id: metadata.id,
          created_at: metadata.created_at,
          expires_at: metadata.expires_at,
          burn_after_read: metadata.burn_after_read === 1,
          password_protected: metadata.password_protected === 1,
          view_count: metadata.view_count,
          read_at: null,
          is_dead_man: metadata.is_dead_man === 1,
          check_in_due: metadata.check_in_due,
          check_in_interval: metadata.check_in_interval,
          is_duress_active: true,
        });
      }

      if (metadata.manage_key_hash !== hash) {
        return NextResponse.json(
          { error: 'Unauthorized management key.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        id: metadata.id,
        created_at: metadata.created_at,
        expires_at: metadata.expires_at,
        burn_after_read: metadata.burn_after_read === 1,
        password_protected: metadata.password_protected === 1,
        view_count: metadata.view_count,
        read_at: metadata.read_at,
        is_dead_man: metadata.is_dead_man === 1,
        check_in_due: metadata.check_in_due,
        check_in_interval: metadata.check_in_interval,
        max_attempts: metadata.max_attempts,
        failed_attempts: metadata.failed_attempts,
        allowed_countries: metadata.allowed_countries,
      });
    }

    // Geofencing Check before loading paste
    const pasteMeta = dbHelper.getPasteMetadata(id);
    if (!pasteMeta) {
      return NextResponse.json(
        { error: 'Paste not found, expired, or already burned.' },
        { status: 404 }
      );
    }

    if (pasteMeta.allowed_countries) {
      const country = req.nextUrl.searchParams.get('mockCountry') || req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || 'IN';
      const allowedList = pasteMeta.allowed_countries.split(',').map(c => c.trim().toUpperCase());
      if (!allowedList.includes(country.toUpperCase())) {
        return NextResponse.json(
          { error: `Geo-Fence Block: Access from your region (${country.toUpperCase()}) is unauthorized.` },
          { status: 403 }
        );
      }
    }

    // Otherwise, fetch the paste content for the recipient
    const paste = dbHelper.getPaste(id);
    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found, expired, or already burned.' },
        { status: 404 }
      );
    }

    // Time-release gate enforcement
    if (paste.release_after && Date.now() < paste.release_after) {
      return NextResponse.json({
        id: paste.id,
        is_time_released: true,
        release_after: paste.release_after,
        locked: true,
        created_at: paste.created_at,
        expires_at: paste.expires_at,
      });
    }

    // Dead man's switch enforcement
    if (paste.is_dead_man === 1 && paste.check_in_due && Date.now() < paste.check_in_due) {
      return NextResponse.json({
        id: paste.id,
        is_dead_man: true,
        check_in_due: paste.check_in_due,
        locked: true,
        created_at: paste.created_at,
        expires_at: paste.expires_at,
      });
    }

    return NextResponse.json({
      id: paste.id,
      ciphertext: paste.ciphertext,
      iv: paste.iv,
      created_at: paste.created_at,
      expires_at: paste.expires_at,
      burn_after_read: paste.burn_after_read === 1,
      password_protected: paste.password_protected === 1,
      view_count: paste.view_count,
      is_dead_man: paste.is_dead_man === 1,
      check_in_due: paste.check_in_due,
      max_attempts: paste.max_attempts,
      failed_attempts: paste.failed_attempts,
      otp_required: paste.otp_required === 1,
      release_after: paste.release_after,
    });
  } catch (error: any) {
    console.error('Error fetching paste:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const manageKey = searchParams.get('manageKey');

    const metadata = dbHelper.getPasteMetadata(id);
    if (!metadata) {
      return NextResponse.json(
        { error: 'Paste not found.' },
        { status: 404 }
      );
    }

    // Authorize deletion if a management key is set
    if (metadata.manage_key_hash) {
      if (!manageKey) {
        return NextResponse.json(
          { error: 'Management key is required to delete this paste.' },
          { status: 401 }
        );
      }
      const hash = sha256(manageKey);
      if (metadata.manage_key_hash !== hash) {
        return NextResponse.json(
          { error: 'Unauthorized management key.' },
          { status: 401 }
        );
      }
    }

    const deleted = dbHelper.deletePaste(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Paste not found or could not be deleted.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting paste:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
