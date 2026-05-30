import { Router, Request, Response, NextFunction } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "stub");

router.post(
  "/summarize",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patient, reason, pastConsultations } = req.body as {
        patient?: {
          name: string;
          age: number | null;
          gender: string | null;
          bloodType: string | null;
          allergies: string[];
          medicalHistory: string | null;
        };
        reason?: string;
        pastConsultations?: {
          date: string;
          diagnosis: string | null;
          notes: string;
          prescriptions: string[];
        }[];
      };

      if (!patient || !patient.name) {
        res.status(400).json({ error: "Patient information is required." });
        return;
      }

      const allergies = patient.allergies?.length
        ? patient.allergies.join(", ")
        : "None recorded";
      const history = patient.medicalHistory || "None recorded";
      const pastSummary =
        pastConsultations && pastConsultations.length > 0
          ? pastConsultations
              .map(
                (pc, i) =>
                  `Visit ${i + 1} (${new Date(pc.date).toLocaleDateString()}):\n` +
                  `  Diagnosis: ${pc.diagnosis || "N/A"}\n` +
                  `  Notes: ${pc.notes || "N/A"}\n` +
                  `  Prescriptions: ${pc.prescriptions.length > 0 ? pc.prescriptions.join(", ") : "None"}`,
              )
              .join("\n\n")
          : "No past consultations with this doctor.";

      const prompt = `You are Curis, an AI clinical assistant helping a doctor prepare for a consultation.

Patient Profile:
- Name: ${patient.name}
- Age: ${patient.age ?? "Unknown"}
- Gender: ${patient.gender || "Unknown"}
- Blood Type: ${patient.bloodType || "Unknown"}
- Allergies: ${allergies}
- Medical History: ${history}

Reason for Consultation: ${reason || "Not specified"}

Past Consultations with this doctor:
${pastSummary}

Based on the above information, provide:
1. A brief clinical summary of the patient (2-3 sentences).
2. Key points the doctor should be aware of (allergies, chronic conditions, medication interactions).
3. Suggested questions to ask the patient to help narrow down the diagnosis.
4. Potential diagnoses to consider based on the history and reason for visit.

Format the response in clear sections. Be concise and clinical.`;

      const key = process.env.GEMINI_API_KEY ?? "";
      const isStubKey = !key || key === "stub" || key.startsWith("your-");

      let summary: string;

      if (isStubKey) {
        summary = `[STUB — add a real GEMINI_API_KEY to .env for live results]

**Clinical Summary**
${patient.name} is a ${patient.age ?? "?"}-year-old ${patient.gender || "patient"}${patient.bloodType ? ` (blood type ${patient.bloodType})` : ""}. ${allergies !== "None recorded" ? `Patient has known allergies to ${allergies}.` : "No known allergies."} Medical history includes: ${history}.

**Key Points**
- Monitor for allergic reactions given known allergies.
- Review current medications for potential interactions.
- Check vital signs and compare with previous visits.

**Suggested Questions**
1. When did the symptoms first appear?
2. On a scale of 1-10, how severe are the symptoms?
3. What makes the symptoms better or worse?
4. Have you taken any medication for this?
5. Any recent travel or exposure to sick individuals?

**Potential Diagnoses to Consider**
- Based on the patient's history and reported reason, several differential diagnoses should be considered. Further clinical examination and diagnostic tests are recommended.`;
      } else {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent(prompt);
          summary = result.response.text();
        } catch (llmErr: unknown) {
          const msg = llmErr instanceof Error ? llmErr.message : String(llmErr);
          console.error("[Gemini API Error]", msg);
          res.status(502).json({
            error: "Gemini API call failed",
            detail: msg,
          });
          return;
        }
      }

      res.json({ summary, model: isStubKey ? "stub" : "gemini-2.5-flash" });
    } catch (error) {
      next(error);
    }
  },
);

export { router as aiRouter };
