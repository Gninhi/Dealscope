import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/news/bookmarks — List all bookmarks with article info
export async function GET() {
  try {
    const workspace = await db.workspace.findFirst({ where: { slug: 'default' } });
    if (!workspace) return NextResponse.json([]);

    const bookmarks = await db.newsBookmark.findMany({
      where: { workspaceId: workspace.id },
      include: { article: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Bookmarks fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

// POST /api/news/bookmarks — Create bookmark
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, notes } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    const workspace = await db.workspace.findFirst({ where: { slug: 'default' } });
    if (!workspace) return NextResponse.json({ error: 'No workspace found' }, { status: 400 });

    // Ensure article exists
    const article = await db.newsArticle.findUnique({ where: { id: articleId } });
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if already bookmarked
    const existing = await db.newsBookmark.findFirst({
      where: { workspaceId: workspace.id, articleId },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already bookmarked' }, { status: 409 });
    }

    const bookmark = await db.newsBookmark.create({
      data: {
        workspaceId: workspace.id,
        articleId,
        notes: notes || '',
      },
      include: { article: true },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Bookmark creation error:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
}

// DELETE /api/news/bookmarks?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Bookmark ID required' }, { status: 400 });

    await db.newsBookmark.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bookmark deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}

// PATCH /api/news/bookmarks — Update bookmark notes
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, notes } = body;

    if (!id) return NextResponse.json({ error: 'Bookmark ID required' }, { status: 400 });

    const bookmark = await db.newsBookmark.update({
      where: { id },
      data: { notes: notes ?? undefined },
      include: { article: true },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Bookmark update error:', error);
    return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 });
  }
}
