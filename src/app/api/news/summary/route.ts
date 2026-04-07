import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { isRateLimited, validateCsrf, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';
import { newsSummarySchema } from '@/validators';
import { getGemma4 } from '@/lib/gemma4';

// POST /api/news/summary
export async function POST(request: NextRequest) {
  const csrfValid = validateCsrf(request);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 10, 60 * 1000)) {
    return rateLimitedResponse();
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = newsSummarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { title, snippet } = parsed.data;

    const gemma4 = getGemma4();
    const result = await gemma4.chat([
      {
        role: 'user',
        content: `Analyse cette actualité M&A en 3-4 phrases maximum en français:\n\nTitre: ${title}\n${snippet ? `Résumé: ${snippet}` : ''}\n\nMets en évidence les faits, montants, impact marché et entreprises concernées. Sois factuel.`,
      },
    ], {
      temperature: 0.4,
      systemPrompt: `Tu es un analyste M&A senior. Tu analyses les actualités de fusion et acquisition en France et en Europe.
Tu fournis un résumé concis en français de 3-4 phrases maximum, en mettant en évidence :
1. Ce qui s'est passé (les faits)
2. Les montants ou valorisations mentionnés
3. L'impact potentiel pour le marché M&A
4. Les entreprises ou secteurs concernés
Sois factuel et professionnel.`,
    });

    const summary = result.content || 'Impossible de générer un résumé.';
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary error:', error);
    return safeErrorResponse('Échec du résumé', 500);
  }
}
