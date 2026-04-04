import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// POST /api/news/summary — Generate AI summary for a news article
export async function POST(request: NextRequest) {
  try {
    const { title, snippet } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

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
    return NextResponse.json({ error: 'Summary failed' }, { status: 500 });
  }
}
