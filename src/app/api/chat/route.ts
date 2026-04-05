import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { chatMessageSchema } from '@/lib/validators';
import { isRateLimited, validateCsrf, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';
import { getGemma4 } from '@/lib/gemma4';

// ─── Suggested Prompts ─────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { label: 'Analyser une entreprise', prompt: 'Analyse cette entreprise pour une perspective M&A: ' },
  { label: 'Critères de recherche', prompt: 'Génère des critères de recherche M&A pour: ' },
  { label: 'Résumé du pipeline', prompt: 'Fais un résumé de mes deals en cours.' },
  { label: 'Scoring ICP', prompt: 'Comment évaluer cette entreprise contre mon profil ICP ? ' },
  { label: 'Email de prospection', prompt: 'Rédige un email de prospection M&A pour: ' },
  { label: 'Signaux M&A', prompt: 'Quels sont les signaux d\'opportunité M&A à surveiller dans le secteur ' },
];

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
    const model = body.model || 'gemma4';

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

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const gemma4 = getGemma4();

          const result = await gemma4.chat(contextMessages, {
            temperature: 0.7,
          });

          const content = result.content;

          await db.chatMessage.create({
            data: {
              workspaceId: authResult.workspaceId,
              role: 'assistant',
              content,
            },
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content, model: result.model, suggestedPrompts: model === 'gemma4' ? SUGGESTED_PROMPTS : undefined })}\n\n`,
            ),
          );
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

    return NextResponse.json({ messages, suggestedPrompts: SUGGESTED_PROMPTS });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return safeErrorResponse('Failed to fetch chat history', 500);
  }
}
