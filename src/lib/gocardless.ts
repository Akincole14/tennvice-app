import { GoCardlessClient, Environments } from "gocardless-nodejs";

const env =
  process.env.GOCARDLESS_ENV === "live" ? Environments.Live : Environments.Sandbox;

export const gocardless = new GoCardlessClient(
  process.env.GOCARDLESS_ACCESS_TOKEN ?? "",
  env,
  { raiseOnIdempotencyConflict: true }
);

export function isGoCardlessConfigured() {
  const token = process.env.GOCARDLESS_ACCESS_TOKEN ?? "";
  return token.length > 0 && !token.includes("your_access_token_here");
}
