import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/news/alerts — List all alerts
export async function GET() {
  try {
    const workspace = await db.workspace.findFirst({ where: { slug: 'default' } });
    if (!workspace) return NextResponse.json([]);

    const alerts = await db.newsAlert.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// POST /api/news/alerts — Create alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, keywords, sector, companyId } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const workspace = await db.workspace.findFirst({ where: { slug: 'default' } });
    if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 400 });

    const alert = await db.newsAlert.create({
      data: {
        workspaceId: workspace.id,
        name,
        type: type || 'keyword',
        keywords: JSON.stringify(keywords || []),
        sector: sector || '',
        companyId: companyId || null,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Alert creation error:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

// DELETE /api/news/alerts?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });

    await db.newsAlert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alert deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}

// PATCH /api/news/alerts — Toggle alert active state
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });

    const alert = await db.newsAlert.update({
      where: { id },
      data: { isActive, lastTriggered: new Date() },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
