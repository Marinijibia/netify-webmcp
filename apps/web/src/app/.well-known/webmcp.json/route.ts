import { NextResponse } from 'next/server';
import { webMCPTools } from '@/lib/webmcp/tools';

export async function GET() {
  return NextResponse.json(
    {
      $schema: 'https://webmcp.org/schemas/v1/manifest.json',
      name: 'Netify',
      description: 'Agent-native accounts receivable and relational trade credit recovery workspace for African SMEs',
      version: '1.0.0',
      protocol: 'WebMCP',
      standard: 'document.modelContext.registerTool',
      homepage: 'https://app.netify.ng',
      documentation: 'https://app.netify.ng/webmcp',
      apiDocumentation: 'https://app.netify.ng/api/webmcp',
      executionEndpoint: 'https://app.netify.ng/api/webmcp/execute',
      demoAccount: {
        loginUrl: 'https://app.netify.ng/login',
        email: 'merchant@netify.ng',
        password: 'Password123!',
      },
      tools: webMCPTools.map((t) => ({
        name: t.name,
        category: t.category,
        description: t.description,
        inputSchema: t.inputSchema,
        executeUrl: `https://app.netify.ng/api/webmcp/execute?tool=${t.name}`,
      })),
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    }
  );
}
