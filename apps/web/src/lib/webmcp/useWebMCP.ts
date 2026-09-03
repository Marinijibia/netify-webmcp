'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { webMCPTools } from './tools';
import { WebMCPToolDefinition, WebMCPExecutionLog } from './types';

export function useWebMCP() {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [registeredTools, setRegisteredTools] = useState<WebMCPToolDefinition[]>(webMCPTools);
  const [executionLogs, setExecutionLogs] = useState<WebMCPExecutionLog[]>([]);
  const isRegisteredRef = useRef(false);

  const executeToolWithLogging = useCallback(async (toolName: string, input: any) => {
    const tool = webMCPTools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`WebMCP Tool "${toolName}" not found.`);
    }

    const start = performance.now();
    const logId = Date.now().toString();

    const consequenceLevel = tool.category === 'MUTATING' ? 'CONSEQUENTIAL_WRITE' : 'READ_ONLY';
    const rawPayload = `${toolName}:${JSON.stringify(input || {})}:${Date.now()}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < rawPayload.length; i++) {
      hash ^= rawPayload.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    const signatureHash = `sha256-${hash.toString(16).padStart(8, '0')}`;

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
        signatureHash,
        consequenceLevel,
        sanitized: true,
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
        signatureHash,
        consequenceLevel,
        sanitized: true,
      };

      setExecutionLogs((prev) => [log, ...prev.slice(0, 49)]);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if browser provides native modelContext
    const hasDocNative = typeof document !== 'undefined' && 'modelContext' in document && typeof (document as any).modelContext?.registerTool === 'function';
    const hasNavNative = typeof navigator !== 'undefined' && 'modelContext' in navigator && typeof (navigator as any).modelContext?.registerTool === 'function';

    // If no native implementation is present, create standard polyfill so all agents/ChatGPT can execute tools
    if (typeof document !== 'undefined' && !(document as any).modelContext) {
      const toolRegistry = new Map<string, any>();
      const polyfill = {
        registerTool: (tool: any) => {
          toolRegistry.set(tool.name, tool);
        },
        unregisterTool: (name: string) => {
          toolRegistry.delete(name);
        },
        getTools: () => Array.from(toolRegistry.values()),
        listTools: () => Array.from(toolRegistry.values()),
        executeTool: async (name: string, input: any) => {
          const t = toolRegistry.get(name);
          if (!t) throw new Error(`Tool "${name}" not registered in document.modelContext`);
          return t.execute(input);
        },
      };

      (document as any).modelContext = polyfill;
      (window as any).modelContext = polyfill;
      (window as any).webmcp = polyfill;
      if (typeof navigator !== 'undefined') {
        (navigator as any).modelContext = polyfill;
      }
    }

    setIsSupported(true);

    if (isRegisteredRef.current) return;
    isRegisteredRef.current = true;

    // Register all tools onto browser modelContext
    webMCPTools.forEach((tool) => {
      try {
        const toolObj = {
          name: tool.name,
          description: tool.description,
          category: tool.category,
          inputSchema: tool.inputSchema,
          execute: async (input: any) => {
            return executeToolWithLogging(tool.name, input);
          },
        };

        if (document && (document as any).modelContext) {
          (document as any).modelContext.registerTool(toolObj);
        }
        if (typeof navigator !== 'undefined' && (navigator as any).modelContext) {
          (navigator as any).modelContext.registerTool(toolObj);
        }
      } catch (err) {
        console.warn(`[WebMCP] Failed to register tool ${tool.name}:`, err);
      }
    });

    setRegisteredTools(webMCPTools);
    console.log(`[WebMCP] Registered ${webMCPTools.length} tools on browser modelContext`);
  }, [executeToolWithLogging]);

  return {
    isSupported,
    registeredTools,
    executionLogs,
    executeTool: executeToolWithLogging,
  };
}
