import { NextResponse } from 'next/server';
import { webMCPTools } from '@/lib/webmcp/tools';

export async function GET() {
  return NextResponse.json({
    protocol: 'WebMCP',
    standard: 'document.modelContext.registerTool',
    version: '1.0.0',
    description: 'Netify WebMCP Browser Agent Tools for African Trade Receivables',
    toolsCount: webMCPTools.length,
    tools: webMCPTools.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      inputSchema: t.inputSchema,
    })),
    documentationUrl: 'https://app.netify.ng/webmcp',
    judgeCredentials: {
      url: 'https://app.netify.ng/login',
      email: 'merchant@netify.ng',
      password: 'Password123!',
    },
  });
}
