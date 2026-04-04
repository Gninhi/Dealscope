/**
 * Workspace helper — single source of truth for workspace resolution.
 * Fixes the slug inconsistency bug where different API routes used
 * different slugs ('default' vs 'dealscope-workspace').
 */

import { db } from './db';

const WORKSPACE_SLUG = 'dealscope';
const WORKSPACE_NAME = 'DealScope Workspace';
const WORKSPACE_PLAN = 'pro';

export async function getWorkspace(): Promise<string> {
  const existing = await db.workspace.findFirst();

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
  const existing = await db.workspace.findFirst();

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
