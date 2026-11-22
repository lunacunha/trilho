// US02-4: company suggestions for the new application form. GET ?q=lu → [{ id, name }] (max 5).
// /api is outside the proxy matcher, so the session is checked here and the role in the service.
import type { NextRequest } from "next/server";
import { AccessDeniedError } from "@/lib/services/errors";
import { suggestCompanies } from "@/lib/services/companies";
import { getCurrentUser } from "@/lib/session";

const MAX_QUERY_LENGTH = 120;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Log in first" }, { status: 401 });

  const query = (request.nextUrl.searchParams.get("q") ?? "").slice(0, MAX_QUERY_LENGTH);
  try {
    return Response.json(await suggestCompanies(user, query));
  } catch (error) {
    if (error instanceof AccessDeniedError) return Response.json({ error: "Access denied" }, { status: 403 });
    console.error("Company suggestions failed", error);
    return Response.json({ error: "Suggestions are unavailable" }, { status: 500 });
  }
}
