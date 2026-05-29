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

profileRouter.get(
  "/profile",
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
  "/profile",
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
  "/profile/avatar",
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
