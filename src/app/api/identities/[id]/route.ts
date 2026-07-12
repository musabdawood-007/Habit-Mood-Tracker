/**
 * DELETE /api/identities/[id] — soft-delete (active=false). Hard delete would
 * orphan habits linked to it; we keep the link, habits just show "no identity".
 */
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Identity } from "@/models/Identity";
import { getSession, requireSession } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const unauth = requireSession(session);
  if (unauth) return unauth;

  await dbConnect();
  const { id } = await params;
  const result = await Identity.updateOne(
    { _id: id, userId: session!.id },
    { $set: { active: false } }
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
