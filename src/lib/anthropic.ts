import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

export type CertificateAnalysis = {
  certName:   string | null;
  issuer:     string | null;
  holder:     string | null;
  licenceNo:  string | null;
  issuedAt:   string | null;
  expiresAt:  string | null;
  isValid:    boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  summary:    string;
};

type SupportedMediaType =
  | "image/jpeg" | "image/png" | "image/gif" | "image/webp"
  | "application/pdf";

export async function analyzeCertificate(
  base64Data: string,
  mediaType: SupportedMediaType,
): Promise<CertificateAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const fileBlock =
    mediaType === "application/pdf"
      ? ({
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64Data },
        })
      : ({
          type: "image" as const,
          source: { type: "base64" as const, media_type: mediaType as Exclude<SupportedMediaType, "application/pdf">, data: base64Data },
        });

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          fileBlock,
          {
            type: "text",
            text: `You are verifying a professional qualification certificate for a home maintenance technician.

Analyse this document and respond ONLY with a valid JSON object — no markdown, no explanation:
{
  "certName":  "<certificate or qualification title, or null>",
  "issuer":    "<issuing organisation or body, or null>",
  "holder":    "<name of the certificate holder, or null>",
  "licenceNo": "<certificate, licence or registration number, or null>",
  "issuedAt":  "<issue date DD/MM/YYYY, or null>",
  "expiresAt": "<expiry date DD/MM/YYYY, or null>",
  "isValid":   <true if this appears to be a genuine professional document, false otherwise>,
  "confidence":"<HIGH | MEDIUM | LOW — how clearly you can read and verify the document>",
  "summary":   "<2–3 sentence assessment: what the document is, who it was issued to, and whether it appears authentic>"
}`,
          },
        ],
      },
    ],
  });

  const raw  = message.content[0].type === "text" ? message.content[0].text.trim() : "";
  // Strip markdown code fences if Claude wraps the JSON
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(text) as CertificateAnalysis;
  } catch {
    return null;
  }
}
