import { NextRequest } from 'next/server';
import { listGrants } from '@/lib/oauth/store';
import { handleCorsPreflight, jsonWithCors } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || undefined;
    const userId = searchParams.get('userId') || undefined;

    const grants = listGrants({ tenantId, userId });

    return jsonWithCors({
      success: true,
      count: grants.length,
      grants,
    });
  } catch (err: any) {
    return jsonWithCors(
      { error: 'server_error', error_description: err?.message || 'Failed to list agent grants' },
      { status: 500 }
    );
  }
}
