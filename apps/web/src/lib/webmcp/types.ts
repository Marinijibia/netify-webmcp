export interface JSONSchemaObject {
  type: 'object';
  properties: Record<string, {
    type: string;
    description?: string;
    enum?: string[];
    items?: Record<string, any>;
  }>;
  required?: string[];
}

export interface WebMCPToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: JSONSchemaObject;
  execute: (input: TInput) => Promise<TOutput>;
  category?: 'READ_ONLY' | 'PROPOSAL' | 'MUTATING';
}

export interface WebMCPExecutionLog {
  id: string;
  toolName: string;
  input: any;
  output: any;
  timestamp: string;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR';
  error?: string;
  signatureHash?: string;
  consequenceLevel?: 'READ_ONLY' | 'CONSEQUENTIAL_WRITE';
  sanitized?: boolean;
}

// Global browser modelContext augmentation
declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        description: string;
        inputSchema: JSONSchemaObject;
        execute: (input: any) => Promise<any>;
      }) => void;
      getTools?: () => any[];
    };
  }
  interface Navigator {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        description: string;
        inputSchema: JSONSchemaObject;
        execute: (input: any) => Promise<any>;
      }) => void;
    };
  }
}
