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
      const { doctorId, slotDate, slotTime, timezoneOffsetMinutes, reason, type, consultationNotes } =
        req.body as {
          doctorId?: string;
          slotDate?: string;
          slotTime?: string;
          timezoneOffsetMinutes?: number;
          reason?: string;
          type?: string;
          consultationNotes?: string;
        };
      const roomUrl = "https://meet.jit.si/curis-telehealth";

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
        select: { id: true, userId: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found." });
      }

      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0));
      startOfDay.setUTCMinutes(startOfDay.getUTCMinutes() + timezoneOffsetMinutes);

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

      const existingDoctorAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId,
          scheduledAt: scheduledDate,
          status: { in: ["UPCOMING", "COMPLETED"] },
        },
        select: { id: true },
      });

      if (existingDoctorAppointment) {
        return res.status(409).json({ error: "Selected time slot is already booked." });
      }

      const existingPatientAppointment = await prisma.appointment.findFirst({
        where: {
          patientId: patient.id,
          scheduledAt: scheduledDate,
          status: "UPCOMING",
        },
        select: { id: true },
      });

      if (existingPatientAppointment) {
        return res.status(409).json({ error: "You already have an appointment at this time." });
      }

      const appointment = await prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
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

        const nextSlots = slots.map((slot) =>
          slot.time === slotTime ? { ...slot, available: false } : slot
        );

        await tx.doctorAvailability.update({
          where: {
            doctorId_date: {
              doctorId,
              date: startOfDay,
            },
          },
          data: { slotsJson: nextSlots },
        });

        return appointment;
      });

      await prisma.notification.create({
        data: {
          userId: doctor.userId,
          type: "booked",
          title: "New Appointment Booked",
          message: `A patient has booked an appointment on ${slotDate} at ${slotTime}.`,
          link: `/doctor/appointments/${appointment.id}`,
        },
      });

      return res.status(201).json({ appointment });
    } catch (err) {
      console.error("[POST /api/appointments]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

appointmentsRouter.post(
  "/:id/cancel",
  requireAuth,
  requireRole("PATIENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      const appointmentId = req.params.id;
      const { reason, timezoneOffsetMinutes } = req.body as { reason?: string; timezoneOffsetMinutes?: number };

      if (timezoneOffsetMinutes === undefined) {
        return res.status(400).json({ error: "timezoneOffsetMinutes is required." });
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient profile not found." });
      }

      const appointmentWithDoctor = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          scheduledAt: true,
          status: true,
          doctor: { select: { userId: true } },
        },
      });

      if (!appointmentWithDoctor || appointmentWithDoctor.patientId !== patient.id) {
        return res.status(404).json({ error: "Appointment not found." });
      }

      const appointment = appointmentWithDoctor;

      if (appointment.status === "COMPLETED") {
        return res.status(400).json({ error: "Completed appointments cannot be cancelled." });
      }

      if (appointment.status === "CANCELLED") {
        return res.status(400).json({ error: "Appointment is already cancelled." });
      }

      const localTimeForCancel = new Date(appointment.scheduledAt.getTime() - timezoneOffsetMinutes * 60000);
      const cancelDateIso = `${localTimeForCancel.getUTCFullYear()}-${(localTimeForCancel.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0")}-${localTimeForCancel.getUTCDate().toString().padStart(2, "0")}`;
      const [cy, cm, cd] = cancelDateIso.split("-").map(Number);
      const startOfDay = new Date(Date.UTC(cy, cm - 1, cd, 0, 0));
      startOfDay.setUTCMinutes(startOfDay.getUTCMinutes() + timezoneOffsetMinutes);

      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            status: "CANCELLED",
            reason: reason || null,
          },
        });

        const availability = await tx.doctorAvailability.findUnique({
          where: {
            doctorId_date: {
              doctorId: appointment.doctorId,
              date: startOfDay,
            },
          },
          select: { slotsJson: true },
        });

        const slots = (availability?.slotsJson as { time: string; available: boolean }[]) ?? [];
        const slotTime = `${localTimeForCancel.getUTCHours()
          .toString()
          .padStart(2, "0")}:${localTimeForCancel.getUTCMinutes()
          .toString()
          .padStart(2, "0")}`;
        const nextSlots = slots.map((slot) =>
          slot.time === slotTime ? { ...slot, available: true } : slot
        );

        await tx.doctorAvailability.update({
          where: {
            doctorId_date: {
              doctorId: appointment.doctorId,
              date: startOfDay,
            },
          },
          data: { slotsJson: nextSlots },
        });
      });

      await prisma.notification.create({
        data: {
          userId: appointment.doctor.userId,
          type: "cancelled",
          title: "Appointment Cancelled",
          message: `A patient cancelled their appointment scheduled on ${appointment.scheduledAt.toISOString().split("T")[0]}.`,
          link: "/doctor/appointments",
        },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("[POST /api/appointments/:id/cancel]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

appointmentsRouter.post(
  "/:id/reschedule",
  requireAuth,
  requireRole("PATIENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      const appointmentId = req.params.id;
      const { newDate, newTime, timezoneOffsetMinutes, reason } = req.body as {
        newDate?: string;
        newTime?: string;
        timezoneOffsetMinutes?: number;
        reason?: string;
      };

      if (!newDate || !newTime || timezoneOffsetMinutes === undefined) {
        return res
          .status(400)
          .json({ error: "newDate, newTime, and timezoneOffsetMinutes are required." });
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient profile not found." });
      }

      const appointmentWithDoctor = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          scheduledAt: true,
          status: true,
          doctor: { select: { userId: true } },
        },
      });

      if (!appointmentWithDoctor || appointmentWithDoctor.patientId !== patient.id) {
        return res.status(404).json({ error: "Appointment not found." });
      }

      const appointment = appointmentWithDoctor;

      if (appointment.status === "COMPLETED") {
        return res.status(400).json({ error: "Completed appointments cannot be rescheduled." });
      }

      if (appointment.status === "CANCELLED") {
        return res.status(400).json({ error: "Cancelled appointments cannot be rescheduled." });
      }

      const [year, month, day] = newDate.split("-").map(Number);
      const [hour, minute] = newTime.split(":").map(Number);
      if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
        return res.status(400).json({ error: "newDate and newTime must be valid." });
      }

      const newScheduledDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
      newScheduledDate.setUTCMinutes(newScheduledDate.getUTCMinutes() + timezoneOffsetMinutes);

      if (newScheduledDate.getTime() < Date.now()) {
        return res.status(400).json({ error: "new time must be in the future." });
      }

      const [ny, nm, nd] = newDate.split("-").map(Number);
      const startOfNewDay = new Date(Date.UTC(ny, nm - 1, nd, 0, 0));
      startOfNewDay.setUTCMinutes(startOfNewDay.getUTCMinutes() + timezoneOffsetMinutes);
      const availability = await prisma.doctorAvailability.findUnique({
        where: {
          doctorId_date: {
            doctorId: appointment.doctorId,
            date: startOfNewDay,
          },
        },
        select: { slotsJson: true },
      });

      const slots = (availability?.slotsJson as { time: string; available: boolean }[]) ?? [];
      const matchingSlot = slots.find((slot) => slot.time === newTime && slot.available);

      if (!matchingSlot) {
        return res.status(409).json({ error: "Selected time slot is unavailable." });
      }

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          scheduledAt: newScheduledDate,
          status: { in: ["UPCOMING", "COMPLETED"] },
        },
        select: { id: true },
      });

      if (existingAppointment) {
        return res.status(409).json({ error: "Selected time slot is already booked." });
      }

      const oldLocal = new Date(appointment.scheduledAt.getTime() - timezoneOffsetMinutes * 60000);
      const oldSlotTime = `${oldLocal.getUTCHours()
        .toString()
        .padStart(2, "0")}:${oldLocal.getUTCMinutes()
        .toString()
        .padStart(2, "0")}`;
      const oldDateIso = `${oldLocal.getUTCFullYear()}-${(oldLocal.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0")}-${oldLocal.getUTCDate().toString().padStart(2, "0")}`;
      const [oy, om, od] = oldDateIso.split("-").map(Number);
      const startOfOldDay = new Date(Date.UTC(oy, om - 1, od, 0, 0));
      startOfOldDay.setUTCMinutes(startOfOldDay.getUTCMinutes() + timezoneOffsetMinutes);

      const updated = await prisma.$transaction(async (tx) => {
        const updatedAppointment = await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            scheduledAt: newScheduledDate,
            reason: reason || null,
          },
        });

        const nextSlots = slots.map((slot) =>
          slot.time === newTime ? { ...slot, available: false } : slot
        );

        await tx.doctorAvailability.update({
          where: {
            doctorId_date: {
              doctorId: appointment.doctorId,
              date: startOfNewDay,
            },
          },
          data: { slotsJson: nextSlots },
        });

        const oldAvailability = await tx.doctorAvailability.findUnique({
          where: {
            doctorId_date: {
              doctorId: appointment.doctorId,
              date: startOfOldDay,
            },
          },
          select: { slotsJson: true },
        });

        const oldSlots = (oldAvailability?.slotsJson as { time: string; available: boolean }[]) ?? [];
        const freedSlots = oldSlots.map((slot) =>
          slot.time === oldSlotTime ? { ...slot, available: true } : slot
        );

        await tx.doctorAvailability.update({
          where: {
            doctorId_date: {
              doctorId: appointment.doctorId,
              date: startOfOldDay,
            },
          },
          data: { slotsJson: freedSlots },
        });

        return updatedAppointment;
      });

      await prisma.notification.create({
        data: {
          userId: appointment.doctor.userId,
          type: "rescheduled",
          title: "Appointment Rescheduled",
          message: `A patient has rescheduled their appointment to ${newDate} at ${newTime}.`,
          link: `/doctor/appointments/${appointment.id}`,
        },
      });

      return res.json({ appointment: updated });
    } catch (err) {
      console.error("[POST /api/appointments/:id/reschedule]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);
