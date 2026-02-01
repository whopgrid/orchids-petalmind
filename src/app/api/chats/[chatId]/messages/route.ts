import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chats, messages } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return null;
  }
  return session.user;
}

async function verifyChatOwnership(chatId: number, userId: string) {
  const chat = await db.select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1);
  
  return chat.length > 0 ? chat[0] : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = parseInt(params.chatId);
    if (!chatId || isNaN(chatId)) {
      return NextResponse.json({ 
        error: 'Valid chat ID is required',
        code: 'INVALID_CHAT_ID' 
      }, { status: 400 });
    }

    const chat = await verifyChatOwnership(chatId, user.id);
    if (!chat) {
      return NextResponse.json({ 
        error: 'Chat not found or access denied',
        code: 'CHAT_ACCESS_DENIED' 
      }, { status: 403 });
    }

    const messageList = await db.select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.timestamp));

    return NextResponse.json(messageList, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = parseInt(params.chatId);
    if (!chatId || isNaN(chatId)) {
      return NextResponse.json({ 
        error: 'Valid chat ID is required',
        code: 'INVALID_CHAT_ID' 
      }, { status: 400 });
    }

    const chat = await verifyChatOwnership(chatId, user.id);
    if (!chat) {
      return NextResponse.json({ 
        error: 'Chat not found or access denied',
        code: 'CHAT_ACCESS_DENIED' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { role, content, imageUrl } = body;

    if (!role) {
      return NextResponse.json({ 
        error: 'Role is required',
        code: 'MISSING_ROLE' 
      }, { status: 400 });
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json({ 
        error: 'Role must be either "user" or "assistant"',
        code: 'INVALID_ROLE' 
      }, { status: 400 });
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ 
        error: 'Content is required',
        code: 'MISSING_CONTENT' 
      }, { status: 400 });
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return NextResponse.json({ 
        error: 'Content cannot be empty',
        code: 'EMPTY_CONTENT' 
      }, { status: 400 });
    }

    if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== 'string') {
      return NextResponse.json({ 
        error: 'Image URL must be a string',
        code: 'INVALID_IMAGE_URL' 
      }, { status: 400 });
    }

    const newMessage = await db.insert(messages)
      .values({
        chatId,
        role,
        content: trimmedContent,
        imageUrl: imageUrl || null,
        timestamp: new Date()
      })
      .returning();

    await db.update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}