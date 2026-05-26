import { PrismaClient, Role } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database...");

  // Create doctor users + their profiles
  const doctorData = [
    {
      email: "dr.santos@curis.health",
      name: "Maria Santos",
      specialization: "General Practitioner",
      bio: "10+ years of experience in family and internal medicine.",
    },
    {
      email: "dr.reyes@curis.health",
      name: "Carlos Reyes",
      specialization: "Cardiologist",
      bio: "Specializes in heart disease prevention and management.",
    },
    {
      email: "dr.lim@curis.health",
      name: "Angela Lim",
      specialization: "Dermatologist",
      bio: "Expert in skin conditions, cosmetic dermatology, and dermatopathology.",
    },
    {
      email: "dr.garcia@curis.health",
      name: "Jose Garcia",
      specialization: "Neurologist",
      bio: "Focused on epilepsy, migraines, and neurodegenerative diseases.",
    },
  ];

  for (const data of doctorData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        // hashed placeholder — in production use bcrypt
        password: crypto.createHash("sha256").update("password123").digest("hex"),
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            name: data.name,
            specialization: data.specialization,
            bio: data.bio,
            isAvailable: true,
          },
        },
      },
    });
    console.log(`  ✅  Doctor upserted: ${data.name} (${user.id})`);
  }

  console.log("🎉  Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
