import { NextRequest, NextResponse } from "next/server";
import { authenticateMcpRequest } from "@/lib/mcp-auth";
import { mcpTools } from "@/lib/mcp-tools";
import { prisma } from "@/lib/prisma";

const JSONRPC_VERSION = "2.0";

function jsonrpcError(id: string | number | null, code: number, message: string) {
  return NextResponse.json({ jsonrpc: JSONRPC_VERSION, id, error: { code, message } });
}

function jsonrpcSuccess(id: string | number | null, result: unknown) {
  return NextResponse.json({ jsonrpc: JSONRPC_VERSION, id, result });
}

async function handleJsonRpc(request: NextRequest) {
  const auth = await authenticateMcpRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return jsonrpcError(null, -32700, "Parse error");
  }

  const { id = null, method, params = {} } = body;

  if (!method) {
    return jsonrpcError(id, -32600, "Invalid request: method required");
  }

  // MCP protocol methods
  if (method === "initialize") {
    return jsonrpcSuccess(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "ori-financeiro-mcp", version: "1.0.0" },
    });
  }

  if (method === "tools/list") {
    const tools = Object.entries(mcpTools).map(([name, { description }]) => ({
      name,
      description,
      inputSchema: { type: "object", properties: {} },
    }));
    return jsonrpcSuccess(id, { tools });
  }

  if (method === "tools/call") {
    const toolName = params.name as string;
    const toolArgs = (params.arguments as Record<string, unknown>) || {};

    const tool = mcpTools[toolName];
    if (!tool) {
      return jsonrpcError(id, -32601, `Unknown tool: ${toolName}`);
    }

    const startTime = Date.now();
    try {
      const result = await tool.handler(auth.tenantId, toolArgs);
      const responseTime = Date.now() - startTime;

      // Log usage
      await prisma.mcpUsageLog.create({
        data: {
          tenantId: auth.tenantId,
          apiKeyId: auth.apiKeyId,
          tool: toolName,
          params: toolArgs as object,
          responseTime,
        },
      });

      return jsonrpcSuccess(id, {
        content: [{ type: "text", text: JSON.stringify(result) }],
      });
    } catch (err) {
      return jsonrpcError(id, -32603, `Tool error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  if (method === "notifications/initialized" || method === "ping") {
    return jsonrpcSuccess(id, {});
  }

  return jsonrpcError(id, -32601, `Method not found: ${method}`);
}

export async function POST(request: NextRequest) {
  return handleJsonRpc(request);
}

export async function GET() {
  return NextResponse.json({
    name: "ori-financeiro-mcp",
    version: "1.0.0",
    description: "MCP server for Ori Financeiro - connect AI agents to your financial data",
    tools: Object.entries(mcpTools).map(([name, { description }]) => ({ name, description })),
  });
}
