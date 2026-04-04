import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/pipeline - get all pipeline stages grouped by stage
export async function GET() {
  try {
    const stages = await db.pipelineStage.findMany({
      orderBy: { movedAt: 'desc' },
      include: {
        company: {
          include: {
            signals: true,
            contacts: true,
            icpProfile: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Group by stage, keeping only the latest stage entry per company
    const seen = new Set<string>();
    const grouped: Record<string, typeof stages> = {};

    for (const stage of stages) {
      if (seen.has(stage.companyId)) continue;
      seen.add(stage.companyId);

      const stageKey = stage.stage;
      if (!grouped[stageKey]) {
        grouped[stageKey] = [];
      }
      grouped[stageKey].push(stage);
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 });
  }
}

// PUT /api/pipeline - move company to new stage
export async function PUT(request: NextRequest) {
  try {
    const { companyId, newStage, notes } = await request.json();

    if (!companyId || !newStage) {
      return NextResponse.json({ error: 'companyId and newStage are required' }, { status: 400 });
    }

    const validStages = ['identifiees', 'a_contacter', 'contactees', 'qualifiees', 'opportunite', 'deal', 'annule'];
    if (!validStages.includes(newStage)) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
    }

    // Create new pipeline stage entry
    const pipelineStage = await db.pipelineStage.create({
      data: {
        companyId,
        stage: newStage,
        notes: notes || '',
        movedAt: new Date(),
      },
    });

    // Update company status
    await db.targetCompany.update({
      where: { id: companyId },
      data: { status: newStage },
    });

    return NextResponse.json(pipelineStage);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return NextResponse.json({ error: 'Failed to update pipeline' }, { status: 500 });
  }
}
