import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { createBookmarkSchema, updateBookmarkSchema } from '@/validators';
import { validateCsrf, safeErrorResponse, isValidId } from '@/lib/security';

// GET /api/news/bookmarks
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const workspaceId = authResult.workspaceId;
    const bookmarks = await db.newsBookmark.findMany({
      where: { workspaceId },
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Bookmarks fetch error:', error);
    return safeErrorResponse('Échec du chargement des signets', 500);
  }
}

// POST /api/news/bookmarks
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createBookmarkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { articleId, notes } = parsed.data;

    if (!isValidId(articleId)) {
      return NextResponse.json({ error: 'Article ID invalide' }, { status: 400 });
    }

    const workspaceId = authResult.workspaceId;

    const article = await db.newsArticle.findUnique({ where: { id: articleId } });
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const existing = await db.newsBookmark.findFirst({
      where: { workspaceId, articleId },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already bookmarked' }, { status: 409 });
    }

    const bookmark = await db.newsBookmark.create({
      data: {
        workspaceId,
        articleId,
        notes: notes || '',
      },
      include: { article: true },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Bookmark creation error:', error);
    return safeErrorResponse('Échec de la création du signet', 500);
  }
}

// DELETE /api/news/bookmarks?id=xxx
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

    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Verify workspace ownership before delete
    const bookmark = await db.newsBookmark.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!bookmark) return NextResponse.json({ error: 'Signet introuvable' }, { status: 404 });

    await db.newsBookmark.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bookmark deletion error:', error);
    return safeErrorResponse('Échec de la suppression du signet', 500);
  }
}

// PATCH /api/news/bookmarks
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateBookmarkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { id, notes } = parsed.data;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Verify workspace ownership before update
    const existing = await db.newsBookmark.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!existing) return NextResponse.json({ error: 'Signet introuvable' }, { status: 404 });

    const bookmark = await db.newsBookmark.update({
      where: { id },
      data: { notes: notes ?? undefined },
      include: { article: true },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Bookmark update error:', error);
    return safeErrorResponse('Échec de la mise à jour du signet', 500);
  }
}
