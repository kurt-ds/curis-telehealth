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

    return res.json({ availability });
  } catch (err) {
    console.error("[GET /api/doctors/:id/availability]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});
