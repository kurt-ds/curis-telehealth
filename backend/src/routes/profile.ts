import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { cloudinary, uploadAvatar } from "../lib/cloudinary";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";

export const profileRouter = Router();

function toDateOnly(date: Date | null) {
  return date ? date.toISOString().split("T")[0] : "";
}

function toProfilePayload(patient: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  avatarUrl: string | null;
  bloodType: string | null;
  height: number | null;
  weight: number | null;
  address: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
}) {
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phone ?? "",
    dateOfBirth: toDateOnly(patient.dateOfBirth),
    gender: patient.gender ?? "",
    bloodType: patient.bloodType ?? "",
    height: patient.height !== null && patient.height !== undefined ? String(patient.height) : "",
    weight: patient.weight !== null && patient.weight !== undefined ? String(patient.weight) : "",
    address: patient.address ?? "",
    emergencyContact: patient.emergencyContact ?? "",
    emergencyPhone: patient.emergencyPhone ?? "",
    allergies: patient.allergies ?? "",
    medicalHistory: patient.medicalHistory ?? "",
    avatarUrl: patient.avatarUrl ?? null,
  };
}

function parseCloudinaryPublicId(url: string) {
  const uploadSegment = "/upload/";
  const folderSegment = "profiles/";
  const uploadIndex = url.indexOf(uploadSegment);
  if (uploadIndex === -1) return null;

  const afterUpload = url.slice(uploadIndex + uploadSegment.length);
  const versionMatch = afterUpload.match(/^v\d+\//);
  const withoutVersion = versionMatch
    ? afterUpload.slice(versionMatch[0].length)
    : afterUpload;

  const folderIndex = withoutVersion.indexOf(folderSegment);
  if (folderIndex === -1) return null;

  const withFolder = withoutVersion.slice(folderIndex);
  const dotIndex = withFolder.lastIndexOf(".");
  if (dotIndex === -1) return null;

  return withFolder.slice(0, dotIndex);
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function toDoctorProfilePayload(doctor: {
  id: string;
  name: string;
  specialization: string;
  bio: string | null;
  avatarUrl: string | null;
  licenseNumber: string | null;
  yearsOfExperience: number | null;
  institution: string | null;
  consultationFee: number | null;
  languages: string | null;
  phone: string | null;
  user: { email: string };
}) {
  const { firstName, lastName } = splitName(doctor.name);

  return {
    id: doctor.id,
    firstName,
    lastName,
    email: doctor.user.email,
    phone: doctor.phone ?? "",
    dateOfBirth: "",
    gender: "",
    specialization: doctor.specialization,
    licenseNumber: doctor.licenseNumber ?? "",
    yearsOfExperience:
      doctor.yearsOfExperience !== null && doctor.yearsOfExperience !== undefined
        ? String(doctor.yearsOfExperience)
        : "",
    institution: doctor.institution ?? "",
    biography: doctor.bio ?? "",
    consultationFee:
      doctor.consultationFee !== null && doctor.consultationFee !== undefined
        ? String(doctor.consultationFee)
        : "",
    languages: doctor.languages ?? "",
    address: "",
    avatarUrl: doctor.avatarUrl ?? null,
  };
}

profileRouter.get(
  "/patient/profile",
  requireAuth,
  requireRole("PATIENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          avatarUrl: true,
          bloodType: true,
          height: true,
          weight: true,
          address: true,
          allergies: true,
          medicalHistory: true,
          emergencyContact: true,
          emergencyPhone: true,
        },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient profile not found." });
      }

      return res.json({ profile: toProfilePayload(patient) });
    } catch (err) {
      console.error("[GET /api/patient/profile]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.put(
  "/patient/profile",
  requireAuth,
  requireRole("PATIENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        gender,
        bloodType,
        height,
        weight,
        address,
        allergies,
        medicalHistory,
        emergencyContact,
        emergencyPhone,
      } = req.body as Record<string, string | number | undefined>;

      const hasRequiredError =
        (firstName !== undefined && String(firstName).trim() === "") ||
        (lastName !== undefined && String(lastName).trim() === "") ||
        (email !== undefined && String(email).trim() === "");

      if (hasRequiredError) {
        return res.status(400).json({ error: "firstName, lastName, and email cannot be empty." });
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true, userId: true, avatarUrl: true },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient profile not found." });
      }

      const data: Record<string, string | number | Date | null> = {};

      if (firstName !== undefined) data.firstName = String(firstName).trim();
      if (lastName !== undefined) data.lastName = String(lastName).trim();
      if (email !== undefined) data.email = String(email).trim();

      if (phone !== undefined) data.phone = String(phone).trim() || null;
      if (gender !== undefined) data.gender = String(gender).trim() || null;
      if (bloodType !== undefined) data.bloodType = String(bloodType).trim() || null;
      if (address !== undefined) data.address = String(address).trim() || null;
      if (allergies !== undefined) data.allergies = String(allergies).trim() || null;
      if (medicalHistory !== undefined) data.medicalHistory = String(medicalHistory).trim() || null;
      if (emergencyContact !== undefined) data.emergencyContact = String(emergencyContact).trim() || null;
      if (emergencyPhone !== undefined) data.emergencyPhone = String(emergencyPhone).trim() || null;

      if (dateOfBirth !== undefined) {
        const dobValue = String(dateOfBirth).trim();
        data.dateOfBirth = dobValue ? new Date(dobValue) : null;
      }

      if (height !== undefined) {
        const parsed = Number(height);
        data.height = Number.isNaN(parsed) ? null : parsed;
      }

      if (weight !== undefined) {
        const parsed = Number(weight);
        data.weight = Number.isNaN(parsed) ? null : parsed;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const patientRecord = await tx.patient.update({
          where: { id: patient.id },
          data,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            avatarUrl: true,
            bloodType: true,
            height: true,
            weight: true,
            address: true,
            allergies: true,
            medicalHistory: true,
            emergencyContact: true,
            emergencyPhone: true,
          },
        });

        if (email !== undefined) {
          await tx.user.update({
            where: { id: patient.userId },
            data: { email: String(email).trim() },
          });
        }

        return patientRecord;
      });

      return res.json({ profile: toProfilePayload(updated) });
    } catch (err) {
      console.error("[PUT /api/patient/profile]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.post(
  "/patient/profile/avatar",
  requireAuth,
  requireRole("PATIENT"),
  uploadAvatar.single("avatar"),
  async (req: AuthRequest, res: Response) => {
    try {
      const file = req.file as (Express.Multer.File & { path?: string }) | undefined;
      if (!file?.path) {
        return res.status(400).json({ error: "Avatar file is required." });
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true, avatarUrl: true },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient profile not found." });
      }

      if (patient.avatarUrl) {
        const publicId = parseCloudinaryPublicId(patient.avatarUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
        }
      }

      const updated = await prisma.patient.update({
        where: { id: patient.id },
        data: { avatarUrl: file.path },
        select: { avatarUrl: true },
      });

      return res.json({ avatarUrl: updated.avatarUrl });
    } catch (err) {
      console.error("[POST /api/patient/profile/avatar]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.get(
  "/doctor/profile",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: {
          id: true,
          name: true,
          specialization: true,
          bio: true,
          avatarUrl: true,
          licenseNumber: true,
          yearsOfExperience: true,
          institution: true,
          consultationFee: true,
          languages: true,
          phone: true,
          user: {
            select: { email: true },
          },
        },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      return res.json({ profile: toDoctorProfilePayload(doctor) });
    } catch (err) {
      console.error("[GET /api/doctor/profile]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.put(
  "/doctor/profile",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        specialization,
        licenseNumber,
        yearsOfExperience,
        institution,
        biography,
        consultationFee,
        languages,
      } = req.body as Record<string, string | number | undefined>;

      const hasRequiredError =
        (firstName !== undefined && String(firstName).trim() === "") ||
        (lastName !== undefined && String(lastName).trim() === "") ||
        (email !== undefined && String(email).trim() === "");

      if (hasRequiredError) {
        return res.status(400).json({ error: "firstName, lastName, and email cannot be empty." });
      }

      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true, userId: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      const data: Record<string, string | number | null> = {};

      if (firstName !== undefined || lastName !== undefined) {
        const first = firstName !== undefined ? String(firstName).trim() : "";
        const last = lastName !== undefined ? String(lastName).trim() : "";
        const fullName = `${first} ${last}`.trim();
        if (fullName) {
          data.name = fullName;
        }
      }

      if (specialization !== undefined) data.specialization = String(specialization).trim();
      if (licenseNumber !== undefined) data.licenseNumber = String(licenseNumber).trim() || null;
      if (institution !== undefined) data.institution = String(institution).trim() || null;
      if (biography !== undefined) data.bio = String(biography).trim() || null;
      if (languages !== undefined) data.languages = String(languages).trim() || null;
      if (phone !== undefined) data.phone = String(phone).trim() || null;

      if (yearsOfExperience !== undefined) {
        const parsed = Number(yearsOfExperience);
        data.yearsOfExperience = Number.isNaN(parsed) ? null : parsed;
      }

      if (consultationFee !== undefined) {
        const parsed = Number(consultationFee);
        data.consultationFee = Number.isNaN(parsed) ? null : parsed;
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (email !== undefined) {
          await tx.user.update({
            where: { id: doctor.userId },
            data: { email: String(email).trim() },
          });
        }

        return tx.doctor.update({
          where: { id: doctor.id },
          data,
          select: {
            id: true,
            name: true,
            specialization: true,
            bio: true,
            avatarUrl: true,
            licenseNumber: true,
            yearsOfExperience: true,
            institution: true,
            consultationFee: true,
            languages: true,
            phone: true,
            user: {
              select: { email: true },
            },
          },
        });
      });

      return res.json({ profile: toDoctorProfilePayload(updated) });
    } catch (err) {
      console.error("[PUT /api/doctor/profile]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.post(
  "/doctor/profile/avatar",
  requireAuth,
  requireRole("DOCTOR"),
  uploadAvatar.single("avatar"),
  async (req: AuthRequest, res: Response) => {
    try {
      const file = req.file as (Express.Multer.File & { path?: string }) | undefined;
      if (!file?.path) {
        return res.status(400).json({ error: "Avatar file is required." });
      }

      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true, avatarUrl: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      if (doctor.avatarUrl) {
        const publicId = parseCloudinaryPublicId(doctor.avatarUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
        }
      }

      const updated = await prisma.doctor.update({
        where: { id: doctor.id },
        data: { avatarUrl: file.path },
        select: { avatarUrl: true },
      });

      return res.json({ avatarUrl: updated.avatarUrl });
    } catch (err) {
      console.error("[POST /api/doctor/profile/avatar]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.get(
  "/doctor/availability/range",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const tzOffsetParam = req.query.tzOffsetMinutes ? Number(req.query.tzOffsetMinutes) : 0;
      const tzOffsetMinutes = Number.isNaN(tzOffsetParam) ? 0 : tzOffsetParam;
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      const fromParam = req.query.from ? String(req.query.from) : null;
      const toParam = req.query.to ? String(req.query.to) : null;

      const fromDate = fromParam ? new Date(fromParam) : new Date();
      fromDate.setHours(0, 0, 0, 0);

      const toDate = toParam ? new Date(toParam) : new Date(fromDate);
      toDate.setDate(fromDate.getDate() + 13);
      toDate.setHours(23, 59, 59, 999);

      const availability = await prisma.doctorAvailability.findMany({
        where: {
          doctorId: doctor.id,
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
          doctorId: doctor.id,
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
      console.error("[GET /api/doctor/availability/range]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.put(
  "/doctor/availability",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { date, slots } = req.body as {
        date?: string;
        slots?: { label: string; state: "open" | "restricted" }[];
      };

      if (!date || !Array.isArray(slots)) {
        return res.status(400).json({ error: "date and slots are required." });
      }

      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "date must be valid." });
      }
      parsedDate.setHours(0, 0, 0, 0);

      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      const slotsJson = slots.map((slot) => ({
        time: slot.label,
        available: slot.state === "open",
      }));

      await prisma.doctorAvailability.upsert({
        where: {
          doctorId_date: {
            doctorId: doctor.id,
            date: parsedDate,
          },
        },
        update: { slotsJson },
        create: {
          doctorId: doctor.id,
          date: parsedDate,
          slotsJson,
        },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("[PUT /api/doctor/availability]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.get(
  "/doctor/queue",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const dateParam = req.query.date ? String(req.query.date) : null;
      const day = dateParam ? new Date(dateParam) : new Date();
      if (Number.isNaN(day.getTime())) {
        return res.status(400).json({ error: "date must be valid." });
      }

      const startOfDay = new Date(day);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);

      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { in: ["UPCOMING", "COMPLETED"] },
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });

      const items = appointments.map((appointment) => ({
        id: appointment.id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
        scheduledAt: appointment.scheduledAt.toISOString(),
        type: appointment.type || "Consultation",
        status: appointment.status,
      }));

      return res.json({ items });
    } catch (err) {
      console.error("[GET /api/doctor/queue]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.get(
  "/doctor/appointments",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      const appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      });

      const items = appointments.map((appointment) => ({
        id: appointment.id,
        patientId: appointment.patient.id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
        scheduledAt: appointment.scheduledAt.toISOString(),
        status: appointment.status,
        notes: appointment.consultationNotes || appointment.reason || null,
        roomUrl: appointment.roomUrl,
      }));

      return res.json({ appointments: items });
    } catch (err) {
      console.error("[GET /api/doctor/appointments]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.get(
  "/doctor/appointments/:id",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: req.params.id },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              dateOfBirth: true,
              gender: true,
              bloodType: true,
              height: true,
              weight: true,
              allergies: true,
              medicalHistory: true,
              emergencyContact: true,
              emergencyPhone: true,
            },
          },
        },
      });

      if (!appointment || appointment.doctorId !== doctor.id) {
        return res.status(404).json({ error: "Appointment not found." });
      }

      const patient = appointment.patient;
      const age = patient.dateOfBirth
        ? Math.floor((Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      return res.json({
        appointment: {
          id: appointment.id,
          scheduledAt: appointment.scheduledAt,
          status: appointment.status,
          reason: appointment.reason,
          diagnosis: appointment.diagnosis,
          consultationNotes: appointment.consultationNotes,
          roomUrl: appointment.roomUrl,
        },
        patient: {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`.trim(),
          email: patient.email,
          phone: patient.phone,
          age,
          gender: patient.gender,
          bloodType: patient.bloodType,
          height: patient.height,
          weight: patient.weight,
          allergies: patient.allergies ? patient.allergies.split(",").map((a: string) => a.trim()) : [],
          medicalHistory: patient.medicalHistory,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
        },
      });
    } catch (err) {
      console.error("[GET /api/doctor/appointments/:id]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

profileRouter.patch(
  "/doctor/appointments/:id/status",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      const appointmentWithPatient = await prisma.appointment.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          doctorId: true,
          scheduledAt: true,
          status: true,
          patient: { select: { userId: true } },
        },
      });

      if (!appointmentWithPatient || appointmentWithPatient.doctorId !== doctor.id) {
        return res.status(404).json({ error: "Appointment not found." });
      }

      const appointment = appointmentWithPatient;

      if (appointment.status !== "UPCOMING") {
        return res.status(400).json({ error: "Only upcoming appointments can be completed." });
      }

      const now = Date.now();
      const scheduledAt = appointment.scheduledAt.getTime();
      const windowStart = scheduledAt - 30 * 60 * 1000;
      const windowEnd = scheduledAt + 60 * 60 * 1000;

      if (now < windowStart || now > windowEnd) {
        return res.status(400).json({
          error: "Appointment can only be completed during the session window (30 min before to 60 min after the scheduled time).",
        });
      }

      const { consultationNotes, diagnosis, prescriptions } = req.body as {
        consultationNotes?: string;
        diagnosis?: string;
        prescriptions?: { medication: string; frequency: string; duration: string }[];
      };

      if (!consultationNotes || !consultationNotes.trim()) {
        return res.status(400).json({ error: "Consultation notes are required." });
      }

      if (!diagnosis || !diagnosis.trim()) {
        return res.status(400).json({ error: "Diagnosis is required." });
      }

      if (!prescriptions || prescriptions.length === 0) {
        return res.status(400).json({ error: "At least one prescription is required." });
      }

      for (const rx of prescriptions) {
        if (!rx.medication || !rx.medication.trim()) {
          return res.status(400).json({ error: "Each prescription must have a medication name." });
        }
        if (!rx.frequency || !rx.frequency.trim()) {
          return res.status(400).json({ error: "Each prescription must have a frequency." });
        }
        if (!rx.duration || !rx.duration.trim()) {
          return res.status(400).json({ error: "Each prescription must have a duration." });
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            status: "COMPLETED",
            consultationNotes: consultationNotes.trim(),
            diagnosis: diagnosis.trim(),
          },
        });

        for (const rx of prescriptions) {
          await tx.prescription.create({
            data: {
              appointmentId: appointment.id,
              medication: rx.medication.trim(),
              frequency: rx.frequency.trim(),
              duration: rx.duration.trim(),
            },
          });
        }
      });

      await prisma.notification.create({
        data: {
          userId: appointment.patient.userId,
          type: "completed",
          title: "Consultation Completed",
          message: `Your consultation has been completed. You can view the details in your records.`,
          link: "/patient/appointments",
        },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("[PATCH /api/doctor/appointments/:id/status]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

/* ─── Patient Records ──────────────────────────────────────────── */
profileRouter.get(
  "/patient/records",
  requireAuth,
  requireRole("PATIENT"),
  async (req: AuthRequest, res: Response) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { userId: req.user?.sub ?? "" },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient profile not found." });
      }

      const appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id, status: "COMPLETED" },
        include: {
          doctor: { select: { name: true, specialization: true } },
          prescriptions: {
            select: { medication: true, frequency: true, duration: true },
          },
        },
        orderBy: { scheduledAt: "desc" },
      });

      const name = `${patient.firstName} ${patient.lastName}`.trim();
      const age = patient.dateOfBirth
        ? Math.floor(
            (Date.now() - patient.dateOfBirth.getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : null;
      const allergies = patient.allergies
        ? patient.allergies.split(",").map((a) => a.trim()).filter(Boolean)
        : [];

      const consultations = appointments.map((a) => ({
        id: a.id,
        date: a.scheduledAt.toISOString(),
        doctorName: `Dr. ${a.doctor.name}`,
        specialty: a.doctor.specialization,
        diagnosis: a.diagnosis,
        clinicalNotes: a.consultationNotes || "",
        prescriptions: a.prescriptions.map(
          (rx) => `${rx.medication} ${rx.frequency}, ${rx.duration}`,
        ),
      }));

      return res.json({
        patient: {
          name,
          age,
          gender: patient.gender,
          bloodType: patient.bloodType,
          height: patient.height,
          weight: patient.weight,
          allergies,
        },
        consultations,
      });
    } catch (err) {
      console.error("[GET /api/patient/records]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
);

/* ─── Doctor Patients List ────────────────────────────────────── */
profileRouter.get(
  "/doctor/patients",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });
      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      const search = (req.query.search as string || "").trim();

      const patients = await prisma.patient.findMany({
        where: {
          appointments: {
            some: {
              doctorId: doctor.id,
              status: "COMPLETED",
            },
          },
          ...(search
            ? {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { id: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          appointments: {
            where: { doctorId: doctor.id, status: "COMPLETED" },
            orderBy: { scheduledAt: "desc" },
            select: { scheduledAt: true },
          },
        },
      });

      const items = patients.map((p) => {
        const name = `${p.firstName} ${p.lastName}`.trim();
        const conditions = p.medicalHistory
          ? p.medicalHistory.split(",").map((c) => c.trim()).filter(Boolean)
          : [];
        const allergies = p.allergies
          ? p.allergies.split(",").map((a) => a.trim()).filter(Boolean)
          : [];
        const lastVisit =
          p.appointments.length > 0 ? p.appointments[0].scheduledAt : null;
        const age = p.dateOfBirth
          ? Math.floor(
              (Date.now() - p.dateOfBirth.getTime()) /
                (365.25 * 24 * 60 * 60 * 1000),
            )
          : null;

        return {
          id: p.id,
          name,
          patientId: p.id,
          age,
          gender: p.gender || "",
          bloodType: p.bloodType || "",
          weight: p.weight ? `${p.weight} kg` : null,
          height: p.height ? `${p.height} cm` : null,
          allergies,
          conditions,
          lastVisit: lastVisit ? lastVisit.toISOString() : null,
          totalVisits: p.appointments.length,
        };
      });

      return res.json({ items, total: items.length });
    } catch (err) {
      console.error("[GET /api/doctor/patients]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
);

/* ─── Patient Consultation Records ────────────────────────────── */
profileRouter.get(
  "/doctor/patients/:patientId/consultations",
  requireAuth,
  requireRole("DOCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user?.sub ?? "" },
        select: { id: true },
      });
      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found." });
      }

      const patient = await prisma.patient.findUnique({
        where: { id: req.params.patientId },
      });
      if (!patient) {
        return res.status(404).json({ error: "Patient not found." });
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          patientId: patient.id,
          doctorId: doctor.id,
          status: "COMPLETED",
        },
        include: {
          doctor: { select: { name: true } },
          prescriptions: {
            select: { medication: true, frequency: true, duration: true },
          },
        },
        orderBy: { scheduledAt: "desc" },
      });

      const items = appointments.map((a) => ({
        id: a.id,
        date: a.scheduledAt.toISOString(),
        type: a.type || "Consultation",
        diagnosis: a.reason || "General consultation",
        notes: a.consultationNotes || "",
        prescriptions: a.prescriptions.map(
          (rx) => `${rx.medication} ${rx.frequency}, ${rx.duration}`,
        ),
        doctor: `Dr. ${a.doctor.name}`,
      }));

      return res.json({ items, total: items.length });
    } catch (err) {
      console.error("[GET /api/doctor/patients/:patientId/consultations]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
);
