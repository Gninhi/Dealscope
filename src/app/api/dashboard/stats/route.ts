import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';

// GET /api/dashboard/stats
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const totalCompanies = await db.targetCompany.count({
      where: { workspaceId: authResult.workspaceId },
    });

    const allCompanies = await db.targetCompany.findMany({
      where: { workspaceId: authResult.workspaceId },
      select: { status: true, sector: true, source: true, icpScore: true, createdAt: true },
    });

    const pipelineByStage: Record<string, number> = {};
    for (const stage of ['identifiees', 'a_contacter', 'contactees', 'qualifiees', 'opportunite', 'deal', 'annule']) {
      pipelineByStage[stage] = allCompanies.filter(c => c.status === stage).length;
    }

    const sectorCounts: Record<string, number> = {};
    for (const c of allCompanies) {
      if (c.sector) {
        sectorCounts[c.sector] = (sectorCounts[c.sector] || 0) + 1;
      }
    }
    const topSectors = Object.entries(sectorCounts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const sourceCounts: Record<string, number> = {};
    for (const c of allCompanies) {
      sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1;
    }
    const companiesBySource = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    const scoredCompanies = allCompanies.filter(c => c.icpScore != null);
    const avgIcpScore = scoredCompanies.length > 0
      ? scoredCompanies.reduce((sum, c) => sum + (c.icpScore || 0), 0) / scoredCompanies.length
      : 0;

    const recentCompanies = await db.targetCompany.findMany({
      where: { workspaceId: authResult.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 5,
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
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
