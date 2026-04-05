import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { requireAuth } from '@/lib/api-guard';
import { isRateLimited, validateCsrf, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';
import { newsSummarySchema } from '@/lib/validators';

// POST /api/news/summary
export async function POST(request: NextRequest) {
  // CSRF validation
  const csrfValid = validateCsrf(request);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  // Rate limiting: 10 req/min per IP
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 10, 60 * 1000)) {
    return rateLimitedResponse();
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    // Zod validation
    const parsed = newsSummarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { title, snippet } = parsed.data;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Tu es un analyste M&A senior. Tu analyses les actualités de fusion et acquisition en France et en Europe.
Tu fournis un résumé concis en français de 3-4 phrases maximum, en mettant en évidence :
1. Ce qui s'est passé (les faits)
2. Les montants ou valorisations mentionnés
3. L'impact potentiel pour le marché M&A
4. Les entreprises ou secteurs concernés
Sois factuel et professionnel.`,
        },
        {
          role: 'user',
          content: `Analyse cette actualité M&A:\n\nTitre: ${title}\n${snippet ? `Résumé: ${snippet}` : ''}`,
        },
      ],
    });

    const summary = completion.choices?.[0]?.message?.content || 'Impossible de générer un résumé.';
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary error:', error);
    return safeErrorResponse('Summary failed', 500);
  }
}
