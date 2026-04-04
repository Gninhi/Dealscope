import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/icp-profiles - list all ICP profiles
export async function GET() {
  try {
    const profiles = await db.iCPProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { targetCompanies: true },
        },
      },
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error fetching ICP profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch ICP profiles' }, { status: 500 });
  }
}

// POST /api/icp-profiles - create ICP profile
export async function POST(request: NextRequest) {
  try {
    const { name, criteria, weights } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let workspace = await db.workspace.findFirst();
    if (!workspace) {
      workspace = await db.workspace.create({
        data: { name: 'Default Workspace', slug: 'default-workspace' },
      });
    }

    const profile = await db.iCPProfile.create({
      data: {
        workspaceId: workspace.id,
        name,
        criteria: criteria || '{}',
        weights: weights || '{}',
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Error creating ICP profile:', error);
    return NextResponse.json({ error: 'Failed to create ICP profile' }, { status: 500 });
  }
}

// PUT /api/icp-profiles - update ICP profile
export async function PUT(request: NextRequest) {
  try {
    const { id, name, criteria, weights, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (criteria !== undefined) updateData.criteria = criteria;
    if (weights !== undefined) updateData.weights = weights;
    if (isActive !== undefined) updateData.isActive = isActive;

    const profile = await db.iCPProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating ICP profile:', error);
    return NextResponse.json({ error: 'Failed to update ICP profile' }, { status: 500 });
  }
}

// DELETE /api/icp-profiles - delete ICP profile
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    await db.iCPProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ICP profile:', error);
    return NextResponse.json({ error: 'Failed to delete ICP profile' }, { status: 500 });
  }
}
