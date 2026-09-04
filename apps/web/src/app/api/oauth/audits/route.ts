import { NextRequest, NextResponse } from 'next/server';
import { getAgentAudits } from '@/lib/oauth/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const audits = getAgentAudits(limit);

    return NextResponse.json({
      success: true,
      count: audits.length,
      audits,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'server_error', error_description: err?.message || 'Failed to list agent audits' },
      { status: 500 }
    );
  }
}
