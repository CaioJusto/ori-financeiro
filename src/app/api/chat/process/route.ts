import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/tenant";
import { parseIntent } from "@/lib/chat/intent-parser";
import { executeIntent } from "@/lib/chat/action-executor";

export async function POST(req: NextRequest) {
  const { error, tenant } = await requirePermission("transactions:read");
  if (error) return error;

  const body = await req.json();
  const { message, conversationId } = body;

  if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const conv = await prisma.chatConversation.create({
      data: {
        title: message.slice(0, 50),
        tenantId: tenant.tenantId,
        userId: tenant.userId,
      },
    });
    convId = conv.id;
  } else {
    // Verify ownership
    const conv = await prisma.chatConversation.findFirst({
      where: { id: convId, tenantId: tenant.tenantId, userId: tenant.userId },
    });
    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Save user message
  await prisma.chatMessage.create({
    data: { conversationId: convId, role: "USER", content: message },
  });

  // Parse intent and execute
  const intent = parseIntent(message);
  const response = await executeIntent(intent, tenant);

  // Save assistant message
  const assistantMsg = await prisma.chatMessage.create({
    data: {
      conversationId: convId,
      role: "ASSISTANT",
      content: response,
      metadata: JSON.parse(JSON.stringify({ intent: intent.action, confidence: intent.confidence, params: intent.params })),
    },
  });

  // Update conversation title from first message
  const msgCount = await prisma.chatMessage.count({ where: { conversationId: convId, role: "USER" } });
  if (msgCount === 1) {
    await prisma.chatConversation.update({
      where: { id: convId },
      data: { title: message.slice(0, 60) },
    });
  }

  // Touch updatedAt
  await prisma.chatConversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    conversationId: convId,
    message: assistantMsg,
  });
}
