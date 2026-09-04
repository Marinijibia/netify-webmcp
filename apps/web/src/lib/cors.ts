import { NextResponse } from 'next/server';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-agent-request, x-agent-client',
  'Access-Control-Max-Age': '86400',
};

export function handleCorsPreflight() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export function jsonWithCors(data: any, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => {
    headers.set(k, v);
  });

  return NextResponse.json(data, {
    ...init,
    headers,
  });
}
