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
      const prompt = `You are Curis, an intelligent telehealth assistant.
Your job is to review a patient's symptoms and recommend the most suitable doctor(s) from the clinic roster below.
Be concise, empathetic, and always advise the patient to consult a licensed physician for a formal diagnosis.

Available Doctors:
${doctorList}

Patient symptoms: ${symptoms.trim()}

Based on these symptoms, which doctor(s) from the list above would you recommend, and why?`;

      // 4. Detect stub key — only block obvious placeholder values
      const key = process.env.GEMINI_API_KEY ?? "";
      const isStubKey = !key || key === "stub" || key.startsWith("your-");

      let recommendation: string;

      if (isStubKey) {
        // ── STUB MODE ────────────────────────────────────────────────
        recommendation = `[STUB RESPONSE — add a real GEMINI_API_KEY to .env to get live Gemini results]

Patient symptoms: "${symptoms}"

Available doctors:
${doctorList}

Recommendation: Please consult with the appropriate specialist based on your symptoms.
If symptoms are severe or worsening, seek emergency care immediately.`;
      } else {
        // ── LIVE MODE — Gemini ────────────────────────────────────────
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent(prompt);
          recommendation = result.response.text();
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
