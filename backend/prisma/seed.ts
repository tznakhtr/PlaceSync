import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Initialize Prisma Client instance for seeding
const prisma = new PrismaClient();

async function main() {
  // Read admin credentials from environment variables with fallback defaults
  const email = process.env.SEED_CELL_EMAIL || 'cell@placesync.edu';
  const password = process.env.SEED_CELL_PASSWORD || 'PlacementCellPassword123!';
  const name = 'Placement Cell Admin';

  console.log(`[Seed] Seeding placement cell admin: ${email}...`);

  // Hash plain password using bcrypt with 10 salt rounds
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Upsert user: creates new user if email not found, updates existing if already present
  // This makes the seed script idempotent (safe to run multiple times without duplicating)
  const cellUser = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: Role.CELL,
    },
    create: {
      name,
      email,
      passwordHash,
      role: Role.CELL,
    },
  });

  console.log(`[Seed] Placement Cell user successfully created/updated:`);
  console.log(`  - ID:    ${cellUser.id}`);
  console.log(`  - Email: ${cellUser.email}`);
  console.log(`  - Role:  ${cellUser.role}`);
}

main()
  .catch((error) => {
    console.error('[Seed] Error running seed script:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect Prisma Client connection on finish
    await prisma.$disconnect();
  });

