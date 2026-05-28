import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";

export const appointmentsRouter = Router();

appointmentsRouter.get(
  "/me",
  requireAuth,
  requireRole("PATIENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient profile not found." });
      }

      const appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });

      return res.json({ appointments });
    } catch (err) {
      console.error("[GET /api/appointments/me]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

appointmentsRouter.post(
  "/",
  requireAuth,
  requireRole("PATIENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { doctorId, slotDate, slotTime, timezoneOffsetMinutes, reason, type, consultationNotes, roomUrl } =
        req.body as {
          doctorId?: string;
          slotDate?: string;
          slotTime?: string;
          timezoneOffsetMinutes?: number;
          reason?: string;
          type?: string;
          consultationNotes?: string;
          roomUrl?: string;
        };

      if (!doctorId || !slotDate || !slotTime || timezoneOffsetMinutes === undefined) {
        return res
          .status(400)
          .json({ error: "doctorId, slotDate, slotTime, and timezoneOffsetMinutes are required." });
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient profile not found." });
      }

      const [year, month, day] = slotDate.split("-").map(Number);
      const [hour, minute] = slotTime.split(":").map(Number);
      if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
        return res.status(400).json({ error: "slotDate and slotTime must be valid." });
      }

      const scheduledDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
      scheduledDate.setUTCMinutes(scheduledDate.getUTCMinutes() + timezoneOffsetMinutes);

      if (scheduledDate.getTime() < Date.now()) {
        return res.status(400).json({ error: "scheduled time must be in the future." });
      }

      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found." });
      }

      const startOfDay = new Date(`${slotDate}T00:00:00Z`);

      const availability = await prisma.doctorAvailability.findUnique({
        where: {
          doctorId_date: {
            doctorId,
            date: startOfDay,
          },
        },
        select: { slotsJson: true },
      });

      const slots = (availability?.slotsJson as { time: string; available: boolean }[]) ?? [];
      const matchingSlot = slots.find((slot) => slot.time === slotTime && slot.available);

      if (!matchingSlot) {
        return res.status(409).json({ error: "Selected time slot is unavailable." });
      }

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId,
          scheduledAt: scheduledDate,
          status: { in: ["UPCOMING", "COMPLETED"] },
        },
        select: { id: true },
      });

      if (existingAppointment) {
        return res.status(409).json({ error: "Selected time slot is already booked." });
      }

      const appointment = await prisma.appointment.create({
        data: {
          doctorId,
          patientId: patient.id,
          scheduledAt: scheduledDate,
          reason: reason || null,
          type: type || null,
          consultationNotes: consultationNotes || null,
          roomUrl: roomUrl || null,
        },
      });

      return res.status(201).json({ appointment });
    } catch (err) {
      console.error("[POST /api/appointments]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);
