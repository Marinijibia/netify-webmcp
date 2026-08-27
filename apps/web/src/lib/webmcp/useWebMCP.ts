'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { webMCPTools } from './tools';
import { WebMCPToolDefinition, WebMCPExecutionLog } from './types';

export function useWebMCP() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [registeredTools, setRegisteredTools] = useState<WebMCPToolDefinition[]>([]);
  const [executionLogs, setExecutionLogs] = useState<WebMCPExecutionLog[]>([]);
  const isRegisteredRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check browser native support
    const hasDocModelContext = typeof document !== 'undefined' && 'modelContext' in document && typeof (document as any).modelContext?.registerTool === 'function';
    const hasNavModelContext = typeof navigator !== 'undefined' && 'modelContext' in navigator && typeof (navigator as any).modelContext?.registerTool === 'function';

    const supported = hasDocModelContext || hasNavModelContext;
    setIsSupported(supported);

    if (isRegisteredRef.current) return;
    isRegisteredRef.current = true;

    // Register all tools onto browser context
    webMCPTools.forEach((tool) => {
      try {
        if (hasDocModelContext && document.modelContext) {
          document.modelContext.registerTool({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            execute: async (input: any) => {
              return executeToolWithLogging(tool.name, input);
            },
          });
        } else if (hasNavModelContext && (navigator as any).modelContext) {
          (navigator as any).modelContext.registerTool({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            execute: async (input: any) => {
              return executeToolWithLogging(tool.name, input);
            },
          });
        }
      } catch (err) {
        console.warn(`[WebMCP] Failed to register tool ${tool.name}:`, err);
      }
    });

    setRegisteredTools(webMCPTools);
    console.log(`[WebMCP] Registered ${webMCPTools.length} tools on browser modelContext`);
  }, []);

  const executeToolWithLogging = useCallback(async (toolName: string, input: any) => {
    const tool = webMCPTools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`WebMCP Tool "${toolName}" not found.`);
    }

    const start = performance.now();
    const logId = Date.now().toString();

    try {
      const output = await tool.execute(input);
      const durationMs = Math.round(performance.now() - start);

      const log: WebMCPExecutionLog = {
        id: logId,
        toolName,
        input,
        output,
        timestamp: new Date().toLocaleTimeString(),
        durationMs,
        status: 'SUCCESS',
      };

      setExecutionLogs((prev) => [log, ...prev.slice(0, 49)]);
      return output;
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      const log: WebMCPExecutionLog = {
        id: logId,
        toolName,
        input,
        output: null,
        timestamp: new Date().toLocaleTimeString(),
        durationMs,
        status: 'ERROR',
        error: err?.message || 'Tool execution failed',
      };

      setExecutionLogs((prev) => [log, ...prev.slice(0, 49)]);
      throw err;
    }
  }, []);

  return {
    isSupported,
    registeredTools,
    executionLogs,
    executeTool: executeToolWithLogging,
  };
}
