import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";

export const profileRouter = Router();

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

      const dateOfBirth = patient.dateOfBirth
        ? patient.dateOfBirth.toISOString().split("T")[0]
        : "";

      return res.json({
        profile: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone ?? "",
          dateOfBirth,
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
        },
      });
    } catch (err) {
      console.error("[GET /api/patient/profile]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);
