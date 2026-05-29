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
      avatarUrl:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    },
    {
      email: "dr.reyes@curis.health",
      name: "Carlos Reyes",
      specialization: "Cardiologist",
      bio: "Specializes in heart disease prevention and management.",
      avatarUrl:
        "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80",
    },
    {
      email: "dr.lim@curis.health",
      name: "Angela Lim",
      specialization: "Dermatologist",
      bio: "Expert in skin conditions, cosmetic dermatology, and dermatopathology.",
      avatarUrl:
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80",
    },
    {
      email: "dr.garcia@curis.health",
      name: "Jose Garcia",
      specialization: "Neurologist",
      bio: "Focused on epilepsy, migraines, and neurodegenerative diseases.",
      avatarUrl:
        "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=400&q=80",
    },
  ];

  const seededDoctorIds: string[] = [];

  for (const data of doctorData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        doctorProfile: {
          update: {
            name: data.name,
            specialization: data.specialization,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            isAvailable: true,
          },
        },
      },
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
            avatarUrl: data.avatarUrl,
            isAvailable: true,
          },
        },
      },
    });
    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (doctor?.id) {
      seededDoctorIds.push(doctor.id);
    }
    console.log(`  ✅  Doctor upserted: ${data.name} (${user.id})`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buildSlots = () => {
    const slots: { time: string; available: boolean }[] = [];

    const addSlots = (startHour: number, endHour: number) => {
      for (let hour = startHour; hour < endHour; hour += 1) {
        const label = `${hour.toString().padStart(2, "0")}:00`;
        slots.push({ time: label, available: true });
      }
    };

    addSlots(8, 12);
    addSlots(13, 17);

    return slots;
  };

  const daysToSeed = 7;
  const availabilityCreates: ReturnType<typeof prisma.doctorAvailability.upsert>[] = [];

  for (const doctorId of seededDoctorIds) {
    for (let offset = 0; offset < daysToSeed; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      availabilityCreates.push(
        prisma.doctorAvailability.upsert({
          where: {
            doctorId_date: {
              doctorId,
              date,
            },
          },
          update: {
            slotsJson: buildSlots(),
          },
          create: {
            doctorId,
            date,
            slotsJson: buildSlots(),
          },
        })
      );
    }
  }

  await Promise.all(availabilityCreates);
  console.log("  ✅  Doctor availability seeded for 7 days");

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
