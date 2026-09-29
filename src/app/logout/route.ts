import { NextResponse, type NextRequest } from "next/server";
import { deleteSession } from "@/lib/session";

// Used when a session cookie is still validly signed but its user was
// deactivated or deleted: clears the cookie and returns to the login page.
export async function GET(request: NextRequest) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
