/**
 * Fix script: sets admin password and ensures AppSetting row exists.
 *
 * Usage:  cd /home/z/my-project && bun run scripts/fix-db.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient({
  datasources: { db: { url: "file:/home/z/my-project/db/custom.db" } },
});

async function main() {
  console.log('=== DealScope DB Fix Script ===\n');

  // 1. Hash the new admin password
  const hash = await bcrypt.hash("Admin123!", 12);
  console.log(`Password hash generated (bcrypt, 12 rounds)`);

  // 2. Update demo@dealscope.fr password
  const updated = await db.user.updateMany({
    where: { email: "demo@dealscope.fr" },
    data: { password: hash },
  });
  console.log(`Updated ${updated.count} user(s) with new password hash`);

  // 3. Ensure AppSetting row exists
  const existing = await db.appSetting.findUnique({ where: { id: "app" } });
  if (!existing) {
    await db.appSetting.create({
      data: { id: "app", isFirstSetup: false },
    });
    console.log("Created AppSetting row (id='app', isFirstSetup=false)");
  } else {
    console.log(`AppSetting row already exists (id='${existing.id}', isFirstSetup=${existing.isFirstSetup})`);
    // Ensure isFirstSetup is false
    if (existing.isFirstSetup) {
      await db.appSetting.update({
        where: { id: "app" },
        data: { isFirstSetup: false },
      });
      console.log("Updated AppSetting: isFirstSetup → false");
    }
  }

  // 4. Verify workspace exists
  const workspaces = await db.workspace.findMany({
    select: { id: true, name: true, slug: true, plan: true },
  });
  console.log(`\nWorkspace(s): ${JSON.stringify(workspaces, null, 2)}`);

  // 5. List all users for verification
  const users = await db.user.findMany({
    select: { id: true, email: true, role: true, workspaceId: true, password: true },
  });
  console.log(`\nUser(s):`);
  for (const u of users) {
    const pwPrefix = u.password ? u.password.substring(0, 20) + '...' : '(empty)';
    console.log(`  - ${u.email} | role=${u.role} | workspaceId=${u.workspaceId} | pw=${pwPrefix}`);
  }

  // 6. Verify password works
  const demoUser = await db.user.findUnique({ where: { email: "demo@dealscope.fr" } });
  if (demoUser) {
    const valid = await bcrypt.compare("Admin123!", demoUser.password);
    console.log(`\nPassword verification for demo@dealscope.fr: ${valid ? '✅ VALID' : '❌ FAILED'}`);
  }

  console.log('\n=== Fix complete ===');
}

main()
  .catch((err) => {
    console.error('Fix script error:', err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
