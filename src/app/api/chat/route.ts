import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { chatMessageSchema } from '@/lib/validators';
import { isRateLimited, validateCsrf, getClientIp, rateLimitedResponse, safeErrorResponse, sanitizeInput } from '@/lib/security';
import { getLLMProviderFactory } from '@/lib/llm';
import { createLogger } from '@/lib/logger';
import { PAGINATION } from '@/constants';

const logger = createLogger('ChatRoute');

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

    const { message, model } = parsed.data;

    // Sanitize message content before DB insert
    const sanitizedMessage = sanitizeInput(message, 4000);

    const workspaceId = authResult.workspaceId;

    await db.chatMessage.create({
      data: {
        workspaceId,
        role: 'user',
        content: sanitizedMessage,
      },
    });

const recentMessages = await db.chatMessage.findMany({
  where: { workspaceId },
  orderBy: { createdAt: 'desc' },
  take: PAGINATION.DEFAULT_PAGE_SIZE,
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
        const llmFactory = getLLMProviderFactory();

        const result = await llmFactory.chat(contextMessages, {
          model: model || llmFactory.getDefaultModel(),
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
              `data: ${JSON.stringify({ content, model: result.model, suggestedPrompts: SUGGESTED_PROMPTS })}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
} catch (error) {
    logger.error('AI chat generation failed', error);
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
  logger.error('Chat request failed', error);
  return safeErrorResponse('Échec du chat', 500);
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
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION.CHAT_HISTORY_LIMIT), 10) || PAGINATION.CHAT_HISTORY_LIMIT),
    PAGINATION.CHAT_HISTORY_MAX
  );
  const before = searchParams.get('before');

  const where = {
    workspaceId,
    ...(before ? { createdAt: { lt: new Date(before) } } : {})
  };

  const messages = await db.chatMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const hasMore = messages.length === limit;
  const nextCursor = messages.length > 0 ? messages[messages.length - 1].createdAt.toISOString() : null;

  return NextResponse.json({
    messages: messages.reverse(),
    suggestedPrompts: SUGGESTED_PROMPTS,
    hasMore,
    nextCursor,
  });
} catch (error) {
  logger.error('Failed to fetch chat history', error);
  return safeErrorResponse('Échec du chargement de l\'historique', 500);
}
}
