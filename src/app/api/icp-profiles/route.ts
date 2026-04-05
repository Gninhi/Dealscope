import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { createIcpProfileSchema, updateIcpProfileSchema } from '@/lib/validators';
import { validateCsrf } from '@/lib/security';

// GET /api/icp-profiles
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const profiles = await db.iCPProfile.findMany({
      where: { workspaceId: authResult.workspaceId },
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

// POST /api/icp-profiles
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createIcpProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { name, criteria, weights } = parsed.data;

    const workspaceId = authResult.workspaceId;

    const profile = await db.iCPProfile.create({
      data: {
        workspaceId,
        name,
        criteria: criteria ? JSON.stringify(criteria) : '{}',
        weights: weights ? JSON.stringify(weights) : '{}',
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Error creating ICP profile:', error);
    return NextResponse.json({ error: 'Failed to create ICP profile' }, { status: 500 });
  }
}

// PUT /api/icp-profiles
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateIcpProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { id, name, criteria, weights, isActive } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (criteria !== undefined) updateData.criteria = JSON.stringify(criteria);
    if (weights !== undefined) updateData.weights = JSON.stringify(weights);
    if (isActive !== undefined) updateData.isActive = isActive;

    // Verify workspace ownership before update
    const existing = await db.iCPProfile.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!existing) {
      return NextResponse.json({ error: 'Profil ICP introuvable' }, { status: 404 });
    }

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

// DELETE /api/icp-profiles
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    // Verify workspace ownership before delete
    const existing = await db.iCPProfile.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!existing) {
      return NextResponse.json({ error: 'Profil ICP introuvable' }, { status: 404 });
    }

    await db.iCPProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ICP profile:', error);
    return NextResponse.json({ error: 'Failed to delete ICP profile' }, { status: 500 });
  }
}
