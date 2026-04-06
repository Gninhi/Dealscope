import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { isRateLimited, getClientIp, rateLimitedResponse, safeErrorResponse, validateCsrf, isValidId } from '@/lib/security';
import { getGemma4, type CompanyData } from '@/lib/gemma4';
import { z } from 'zod';

const analyzeRequestSchema = z.object({
  companyId: z.string().optional(),
  companyData: z.object({
    name: z.string(),
    siren: z.string().optional(),
    sector: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    revenue: z.number().optional(),
    employeeCount: z.number().optional(),
    nafCode: z.string().optional(),
    nafLabel: z.string().optional(),
    region: z.string().optional(),
    dateImmatriculation: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

// POST /api/ai/analyze — SSE streaming company analysis
export async function POST(request: NextRequest) {
  // Rate limiting: 5 req/min per IP (heavier operation)
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 5, 60 * 1000)) {
    return rateLimitedResponse();
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { companyId, companyData } = parsed.data;

    // Resolve company data: either from companyId or direct payload
    let resolvedCompany: CompanyData;

    if (companyId) {
      // Validate ID format
      if (!isValidId(companyId)) {
        return NextResponse.json(
          { error: 'ID entreprise invalide' },
          { status: 400 },
        );
      }

      const company = await db.targetCompany.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Entreprise non trouvée' },
          { status: 404 },
        );
      }

      // Ensure the company belongs to the user's workspace
      if (company.workspaceId !== authResult.workspaceId) {
        return NextResponse.json(
          { error: 'Entreprise non trouvée' },
          { status: 404 },
        );
      }

      resolvedCompany = {
        name: company.name,
        siren: company.siren,
        sector: company.sector,
        nafCode: company.nafCode,
        nafLabel: company.nafLabel,
        revenue: company.revenue ?? undefined,
        employeeCount: company.employeeCount ?? undefined,
        city: company.city || undefined,
        region: company.region || undefined,
        dateImmatriculation: company.dateImmatriculation || undefined,
        natureJuridique: company.natureJuridique || undefined,
        categorieEntreprise: company.categorieEntreprise || undefined,
        trancheCA: company.trancheCA || undefined,
        status: company.status || undefined,
        notes: company.notes || undefined,
      };
    } else if (companyData) {
      // Sanitize direct company data payload
      resolvedCompany = {
        name: typeof companyData.name === 'string' ? companyData.name.slice(0, 500) : undefined,
        siren: typeof companyData.siren === 'string' ? companyData.siren.slice(0, 9) : undefined,
        sector: typeof companyData.sector === 'string' ? companyData.sector.slice(0, 200) : undefined,
        nafCode: typeof companyData.nafCode === 'string' ? companyData.nafCode.slice(0, 20) : undefined,
        nafLabel: typeof companyData.nafLabel === 'string' ? companyData.nafLabel.slice(0, 500) : undefined,
        revenue: typeof companyData.revenue === 'number' ? companyData.revenue : undefined,
        employeeCount: companyData.employeeCount ?? undefined,
        city: typeof companyData.city === 'string' ? companyData.city.slice(0, 200) : undefined,
        region: typeof companyData.region === 'string' ? companyData.region.slice(0, 200) : undefined,
        dateImmatriculation: typeof companyData.dateImmatriculation === 'string' ? companyData.dateImmatriculation.slice(0, 20) : undefined,
        notes: typeof companyData.notes === 'string' ? companyData.notes.slice(0, 10000) : undefined,
      };
    } else {
      return NextResponse.json(
        { error: 'Paramètres manquants: companyId ou companyData requis' },
        { status: 400 },
      );
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const gemma4 = getGemma4();

          // Send analysis start event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'start', company: resolvedCompany.name || 'Entreprise' })}\n\n`,
            ),
          );

          // Generate the analysis
          const result = await gemma4.analyzeCompany(resolvedCompany);

          // Send the analysis result
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'result', content: result.content, model: result.model })}\n\n`,
            ),
          );

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('[AI Analyze] Error:', error);
          const errorMsg = 'Erreur lors de l\'analyse IA. Veuillez réessayer.';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', content: errorMsg })}\n\n`,
            ),
          );
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
    console.error('[AI Analyze] Unexpected error:', error);
    return safeErrorResponse('Analyse IA échouée', 500);
  }
}
