import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { safeErrorResponse, getClientIp, isRateLimited, rateLimitedResponse } from '@/lib/security';

// GET /api/dashboard/stats
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // Rate limit dashboard stats fetching
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 60, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const totalCompanies = await db.targetCompany.count({
      where: { workspaceId: authResult.workspaceId },
    });

    // Use Prisma groupBy for pipelineByStage — avoids loading all companies in memory
    const pipelineGroups = await db.targetCompany.groupBy({
      by: ['status'],
      where: { workspaceId: authResult.workspaceId },
      _count: true,
    });
    const pipelineByStage: Record<string, number> = {};
    for (const stage of ['identifiees', 'a_contacter', 'contactees', 'qualifiees', 'opportunite', 'deal', 'annule']) {
      const found = pipelineGroups.find(g => g.status === stage);
      pipelineByStage[stage] = found ? found._count : 0;
    }

    // Use Prisma groupBy for sectorCounts
    const sectorGroups = await db.targetCompany.groupBy({
      by: ['sector'],
      where: { workspaceId: authResult.workspaceId, sector: { not: '' } },
      _count: true,
    });
    const topSectors = sectorGroups
      .map(g => ({ sector: g.sector, count: g._count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Use Prisma groupBy for sourceCounts
    const sourceGroups = await db.targetCompany.groupBy({
      by: ['source'],
      where: { workspaceId: authResult.workspaceId, source: { not: '' } },
      _count: true,
    });
    const companiesBySource = sourceGroups
      .map(g => ({ source: g.source!, count: g._count }))
      .sort((a, b) => b.count - a.count);

    // Average ICP score via aggregation query
    const icpAgg = await db.targetCompany.aggregate({
      where: { workspaceId: authResult.workspaceId, icpScore: { not: null } },
      _avg: { icpScore: true },
    });
    const avgIcpScore = icpAgg._avg.icpScore ?? 0;

    const recentCompanies = await db.targetCompany.findMany({
      where: { workspaceId: authResult.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        signals: true,
        contacts: true,
        pipelineStages: { orderBy: { movedAt: 'desc' }, take: 1 },
        icpProfile: { select: { id: true, name: true } },
      },
    });

    const totalSignals = await db.companySignal.count({
      where: { company: { workspaceId: authResult.workspaceId } },
    });
    const totalContacts = await db.contact.count({
      where: { company: { workspaceId: authResult.workspaceId } },
    });

    return NextResponse.json({
      totalCompanies,
      pipelineByStage,
      topSectors,
      companiesBySource,
      avgIcpScore: Math.round(avgIcpScore),
      recentCompanies,
      totalSignals,
      totalContacts,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return safeErrorResponse('Failed to fetch stats', 500);
  }
}
