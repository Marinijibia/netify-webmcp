import { NextRequest } from 'next/server';
import { getAgentAudits } from '@/lib/oauth/store';
import { handleCorsPreflight, jsonWithCors } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const audits = getAgentAudits(limit);

    return jsonWithCors({
      success: true,
      count: audits.length,
      audits,
    });
  } catch (err: any) {
    return jsonWithCors(
      { error: 'server_error', error_description: err?.message || 'Failed to list agent audits' },
      { status: 500 }
    );
  }
}
