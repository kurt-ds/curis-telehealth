import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const doctorsRouter = Router();

doctorsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isAvailable: true },
      select: {
        id: true,
        name: true,
        specialization: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    });

    const payload = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialization,
      image: doctor.avatarUrl ?? "",
    }));

    return res.json({ doctors: payload });
  } catch (err) {
    console.error("[GET /api/doctors]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

doctorsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        specialization: true,
        bio: true,
        avatarUrl: true,
        institution: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    return res.json({
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialization,
        title: `Dr. ${doctor.name}`,
        image: doctor.avatarUrl ?? "",
        education: doctor.institution ?? "",
        bio: doctor.bio ?? "",
      },
    });
  } catch (err) {
    console.error("[GET /api/doctors/:id]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

doctorsRouter.get("/:id/availability", async (req: Request, res: Response) => {
  try {
    const fromParam = req.query.from ? String(req.query.from) : null;
    const toParam = req.query.to ? String(req.query.to) : null;
    const tzOffsetParam = req.query.tzOffsetMinutes ? Number(req.query.tzOffsetMinutes) : 0;
    const tzOffsetMinutes = Number.isNaN(tzOffsetParam) ? 0 : tzOffsetParam;

    const fromDate = fromParam ? new Date(fromParam) : new Date();
    fromDate.setHours(0, 0, 0, 0);

    const toDate = toParam ? new Date(toParam) : new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 6);
    toDate.setHours(23, 59, 59, 999);

    const availability = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: req.params.id,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        date: true,
        slotsJson: true,
      },
      orderBy: { date: "asc" },
    });

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: req.params.id,
        status: { in: ["UPCOMING", "COMPLETED"] },
        scheduledAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        scheduledAt: true,
      },
    });

    const bookedByDate = new Map<string, Set<string>>();
    for (const appointment of appointments) {
      const localTime = new Date(appointment.scheduledAt.getTime() - tzOffsetMinutes * 60000);
      const dateKey = `${localTime.getUTCFullYear()}-${(localTime.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0")}-${localTime.getUTCDate().toString().padStart(2, "0")}`;
      const hours = localTime.getUTCHours().toString().padStart(2, "0");
      const minutes = localTime.getUTCMinutes().toString().padStart(2, "0");
      const time = `${hours}:${minutes}`;
      if (!bookedByDate.has(dateKey)) {
        bookedByDate.set(dateKey, new Set());
      }
      bookedByDate.get(dateKey)?.add(time);
    }

    const payload = availability.map((entry) => {
      const localDate = new Date(entry.date.getTime() - tzOffsetMinutes * 60000);
      const dateKey = `${localDate.getUTCFullYear()}-${(localDate.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0")}-${localDate.getUTCDate().toString().padStart(2, "0")}`;
      const bookedTimes = Array.from(bookedByDate.get(dateKey) ?? []);
      const slotsJson = (entry.slotsJson as { time: string; available: boolean }[]).map(
        (slot) =>
          bookedTimes.includes(slot.time) ? { ...slot, available: false } : slot
      );

      return {
        date: entry.date,
        slotsJson,
        bookedTimes,
      };
    });
    return res.json({ availability: payload });
  } catch (err) {
    console.error("[GET /api/doctors/:id/availability]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});
