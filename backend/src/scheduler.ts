import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function buildSlots() {
  const slots: { time: string; available: boolean }[] = [];
  for (let hour = 8; hour < 12; hour++) {
    slots.push({ time: `${hour.toString().padStart(2, "0")}:00`, available: true });
  }
  for (let hour = 13; hour < 17; hour++) {
    slots.push({ time: `${hour.toString().padStart(2, "0")}:00`, available: true });
  }
  return slots;
}

async function extendAvailability() {
  try {
    const doctors = await prisma.doctor.findMany({ select: { id: true } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const furthestDate = new Date(today);
    furthestDate.setDate(today.getDate() + 14);

    for (const doctor of doctors) {
      const existing = await prisma.doctorAvailability.findMany({
        where: { doctorId: doctor.id },
        select: { date: true },
      });
      const existingDates = new Set(existing.map((e) => e.date.toISOString().slice(0, 10)));

      let addedCount = 0;
      for (let offset = 0; offset < 14; offset++) {
        const date = new Date(today);
        date.setDate(today.getDate() + offset);
        const iso = date.toISOString().slice(0, 10);
        if (!existingDates.has(iso)) {
          await prisma.doctorAvailability.create({
            data: { doctorId: doctor.id, date, slotsJson: buildSlots() },
          });
          addedCount++;
        }
      }
      if (addedCount > 0) {
        console.log(`[scheduler] Added ${addedCount} availability day(s) for doctor ${doctor.id}`);
      }
    }
  } catch (err) {
    console.error("[scheduler] extendAvailability error:", err);
  }
}

export function startScheduler() {
  // Run every day at midnight (00:00)
  cron.schedule("0 0 * * *", () => {
    console.log("[scheduler] Running daily availability extension...");
    extendAvailability();
  });

  // Also run once on startup to fill any gaps
  extendAvailability();

  console.log("[scheduler] Started — daily availability extension active");
}
