// Better Auth endpoints (sign-up, sign-in, verify-email, sign-out, ...).
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
