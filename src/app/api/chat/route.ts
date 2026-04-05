import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { chatMessageSchema } from '@/lib/validators';
import { isRateLimited, validateCsrf, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/chat - SSE streaming chat
export async function POST(request: NextRequest) {
  // Rate limiting: 10 req/min per IP
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 10, 60 * 1000)) {
    return rateLimitedResponse();
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { message } = parsed.data;

    const workspaceId = authResult.workspaceId;

    await db.chatMessage.create({
      data: {
        workspaceId,
        role: 'user',
        content: message,
      },
    });

    const recentMessages = await db.chatMessage.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const contextMessages = recentMessages
      .reverse()
      .map(m => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

    const systemPrompt = `Tu es DealScope AI, un assistant intelligent spécialisé dans les fusions et acquisitions (M&A) en France. Tu aides les analystes M&A à:

1. Analyser des entreprises cibles potentielles
2. Évaluer la pertinence des cibles par rapport aux profils ICP (Ideal Customer Profile)
3. Identifier des signaux d'opportunité (croissance, changement de direction, financement, etc.)
4. Fournir des insights sur les secteurs d'activité français
5. Aider à la qualification de cibles et à la préparation d'approches

Tu parles français et tu es concis et professionnel. Quand on te donne des données financières, analyse-les avec rigueur. Si on te demande de chercher des entreprises, suggère des critères de recherche pertinents.

Réponds toujours en français.`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const zai = await ZAI.create();

          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              ...contextMessages,
            ],
          });

          const content = completion.choices?.[0]?.message?.content || 'Je n\'ai pas pu générer de réponse.';

          await db.chatMessage.create({
            data: {
              workspaceId: authResult.workspaceId,
              role: 'assistant',
              content,
            },
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('AI chat error:', error);
          const errorMsg = 'Désolé, une erreur est survenue lors de la génération de la réponse.';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errorMsg })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return safeErrorResponse('Chat failed', 500);
  }
}

// GET /api/chat
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // Rate limit chat history fetching
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 60, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const workspaceId = authResult.workspaceId;

    const messages = await db.chatMessage.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return safeErrorResponse('Failed to fetch chat history', 500);
  }
}
