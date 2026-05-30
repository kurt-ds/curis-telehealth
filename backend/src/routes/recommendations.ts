import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const prisma = new PrismaClient();

// ── Gemini client ─────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "stub");

// ── POST /api/recommendations ─────────────────────────────────────
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { symptoms } = req.body as { symptoms?: string };

      if (!symptoms || symptoms.trim().length === 0) {
        res.status(400).json({ error: "symptoms field is required." });
        return;
      }

      // 1. Fetch all available doctors from the database
      const doctors = await prisma.doctor.findMany({
        where: { isAvailable: true },
        select: { name: true, specialization: true, bio: true },
      });

      // 2. Format doctor list into a human-readable block for the prompt
      const doctorList =
        doctors.length > 0
          ? doctors
              .map(
                (d, i) =>
                  `${i + 1}. Dr. ${d.name} — ${d.specialization}${d.bio ? `: ${d.bio}` : ""}`
              )
              .join("\n")
          : "No doctors currently registered in the system.";

      // 3. Build the full prompt for Gemini
      const allSpecialties = [...new Set(doctors.map((d) => d.specialization))].join(", ");
      const prompt = `You are Curis, an intelligent telehealth assistant.
Your job is to review a patient's symptoms and recommend the most suitable doctor specialty from the list below.
Respond ONLY with a JSON object (no markdown, no backticks) with these fields:
- "specialty": the exact specialty name from the list that best matches the symptoms (or empty string if none match)
- "message": a short, empathetic recommendation (1-2 sentences) starting with "Here is the doctor that fits your needs."

Available specialties: ${allSpecialties}

Available Doctors:
${doctorList}

Patient symptoms: ${symptoms.trim()}

JSON response:`;

      // 4. Detect stub key — only block obvious placeholder values
      const key = process.env.GEMINI_API_KEY ?? "";
      const isStubKey = !key || key === "stub" || key.startsWith("your-");

      let recommendation: string;
      let specialty = "";

      if (isStubKey) {
        // ── STUB MODE ────────────────────────────────────────────────
        const stubSpecialties = ["General Practitioner", "Cardiologist", "Dermatologist", "Neurologist"];
        specialty = stubSpecialties[Math.floor(Math.random() * stubSpecialties.length)];
        recommendation = `Here is the doctor that fits your needs. Based on your symptoms, a ${specialty} would be the most appropriate specialist to consult.`;
      } else {
        // ── LIVE MODE — Gemini ────────────────────────────────────────
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent(prompt);
          const text = result.response.text().trim();
          const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
          specialty = parsed.specialty || "";
          recommendation = parsed.message || "Here is the doctor that fits your needs.";
        } catch (llmErr: unknown) {
          const msg = llmErr instanceof Error ? llmErr.message : String(llmErr);
          console.error("[Gemini API Error]", msg);
          res.status(502).json({
            error: "Gemini API call failed",
            detail: msg,
            hint: "Check that your GEMINI_API_KEY is valid at https://aistudio.google.com/app/apikey",
          });
          return;
        }
      }

      res.json({
        recommendation,
        specialty,
        doctorsConsulted: doctors.length,
        symptoms: symptoms.trim(),
        model: isStubKey ? "stub" : "gemini-2.5-flash",
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── GET /api/recommendations (probe) ─────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  res.json({
    message:
      "POST to this endpoint with { symptoms: string } to get Gemini-powered recommendations.",
  });
});

export { router as recommendationsRouter };
