/**
 * DELETE /api/entries/[id] — delete an entry (only if it belongs to the user)
 */
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Entry } from "@/models/Entry";
import { getSession, requireSession } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();

  const result = await Entry.deleteOne({ _id: params.id, userId: session!.id });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
