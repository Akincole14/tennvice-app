import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const SECRET = process.env.NEXTAUTH_SECRET ?? "tennvice-mobile-secret";

export interface MobileTokenPayload {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export function signMobileToken(payload: MobileTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as MobileTokenPayload;
  } catch {
    return null;
  }
}

export function getMobileUser(req: NextRequest): MobileTokenPayload | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyMobileToken(auth.slice(7));
}
