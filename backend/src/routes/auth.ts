import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { uploadAvatar } from "../lib/cloudinary";

export const authRouter = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId: string, role: string) {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return jwt.sign({ sub: userId, role }, secret, { expiresIn } as jwt.SignOptions);
}

// ── POST /api/auth/register/patient ──────────────────────────────────────────
// Accepts multipart/form-data so the avatar file can be included.
authRouter.post(
  "/register/patient",
  uploadAvatar.single("avatar"), // optional – multer won't fail if no file sent
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phone,
        address,
        bloodType,
        height,
        weight,
        allergies,
        medicalHistory,
        emergencyContact,
        emergencyPhone,
      } = req.body as Record<string, string>;

      // ── Validation ──────────────────────────────────────────────
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "email, password, firstName and lastName are required." });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      // ── Hash password ───────────────────────────────────────────
      const hashedPassword = await bcrypt.hash(password, 12);

      // ── Cloudinary avatar URL (if file was uploaded) ────────────
      // multer-storage-cloudinary attaches the Cloudinary result to req.file
      const avatarUrl = (req.file as Express.Multer.File & { path?: string })?.path ?? null;

      // ── Create User + Patient in a transaction ──────────────────
      const { user, patient } = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: "PATIENT",
          },
        });

        const patient = await tx.patient.create({
          data: {
            userId: user.id,
            email,
            firstName,
            lastName,
            phone: phone || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender: gender || null,
            avatarUrl,
            bloodType: bloodType || null,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            allergies: allergies || null,
            medicalHistory: medicalHistory || null,
            emergencyContact: emergencyContact || null,
            emergencyPhone: emergencyPhone || null,
            address: address || null,
          },
        });

        return { user, patient };
      });

      // ── Issue JWT ───────────────────────────────────────────────
      const token = signToken(user.id, "PATIENT");

      return res.status(201).json({
        message: "Patient account created successfully.",
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          avatarUrl: patient.avatarUrl,
        },
      });
    } catch (err) {
      console.error("[register/patient]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

// ── POST /api/auth/login/patient ─────────────────────────────────────────────
authRouter.post("/login/patient", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { patientProfile: true },
    });

    if (!user || user.role !== "PATIENT") {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = signToken(user.id, "PATIENT");

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      patient: user.patientProfile
        ? {
            id: user.patientProfile.id,
            firstName: user.patientProfile.firstName,
            lastName: user.patientProfile.lastName,
            avatarUrl: user.patientProfile.avatarUrl,
          }
        : null,
    });
  } catch (err) {
    console.error("[login/patient]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /api/auth/register/doctor ───────────────────────────────────────────
authRouter.post(
  "/register/doctor",
  uploadAvatar.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      const {
        email, password, firstName, lastName, specialty,
        licenseNumber, institution, yearsOfExperience,
        consultationFee, languages, phone, bio,
      } = req.body as Record<string, string>;

      if (!email || !password || !firstName || !lastName || !specialty) {
        return res.status(400).json({
          error: "email, password, firstName, lastName and specialty are required.",
        });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const avatarUrl = (req.file as Express.Multer.File & { path?: string })?.path ?? null;

      const { user, doctor } = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email, password: hashedPassword, role: "DOCTOR" },
        });
        const doctor = await tx.doctor.create({
          data: {
            userId: user.id,
            name: `${firstName} ${lastName}`.trim(),
            specialization: specialty,
            licenseNumber: licenseNumber || null,
            institution: institution || null,
            yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience, 10) : null,
            consultationFee: consultationFee ? parseFloat(consultationFee) : null,
            languages: languages || null,
            phone: phone || null,
            bio: bio || null,
            avatarUrl,
          },
        });
        return { user, doctor };
      });

      const token = signToken(user.id, "DOCTOR");

      return res.status(201).json({
        message: "Doctor account created successfully. Pending credential verification.",
        token,
        user: { id: user.id, email: user.email, role: user.role },
        doctor: {
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          avatarUrl: doctor.avatarUrl,
        },
      });
    } catch (err) {
      console.error("[register/doctor]", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

// ── POST /api/auth/login/doctor ───────────────────────────────────────────────
authRouter.post("/login/doctor", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { doctorProfile: true },
    });

    if (!user || user.role !== "DOCTOR") {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = signToken(user.id, "DOCTOR");

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: { id: user.id, email: user.email, role: user.role },
      doctor: user.doctorProfile
        ? {
            id: user.doctorProfile.id,
            name: user.doctorProfile.name,
            specialization: user.doctorProfile.specialization,
            avatarUrl: user.doctorProfile.avatarUrl,
          }
        : null,
    });
  } catch (err) {
    console.error("[login/doctor]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});
