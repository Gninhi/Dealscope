// NOTE: In production, use a database unique constraint (slug) to handle race conditions at the DB level.
// This is already handled by @unique on slug in the Prisma schema.

/**
 * Workspace helper — single source of truth for workspace resolution.
 * Filters by the canonical slug 'dealscope' to ensure consistency
 * across all API routes.
 */

import { db } from './db';

const WORKSPACE_SLUG = 'dealscope';
const WORKSPACE_NAME = 'DealScope Workspace';
const WORKSPACE_PLAN = 'pro';

export async function getWorkspace(): Promise<string> {
  const existing = await db.workspace.findFirst({ where: { slug: WORKSPACE_SLUG } });

  if (existing) {
    return existing.id;
  }

  const workspace = await db.workspace.create({
    data: {
      name: WORKSPACE_NAME,
      slug: WORKSPACE_SLUG,
      plan: WORKSPACE_PLAN,
    },
  });

  return workspace.id;
}

export async function ensureWorkspace(): Promise<{
  id: string;
  name: string;
  slug: string;
  plan: string;
}> {
  const existing = await db.workspace.findFirst({ where: { slug: WORKSPACE_SLUG } });

  if (existing) {
    return existing;
  }

  const workspace = await db.workspace.create({
    data: {
      name: WORKSPACE_NAME,
      slug: WORKSPACE_SLUG,
      plan: WORKSPACE_PLAN,
    },
  });

  return workspace;
}
