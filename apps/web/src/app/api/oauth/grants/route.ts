import { NextRequest, NextResponse } from 'next/server';
import { listGrants } from '@/lib/oauth/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const userId = searchParams.get('userId') || undefined;

    const grants = listGrants({ tenantId, userId });

    return NextResponse.json({
      success: true,
      count: grants.length,
      grants,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'server_error', error_description: err?.message || 'Failed to list agent grants' },
      { status: 500 }
    );
  }
}
