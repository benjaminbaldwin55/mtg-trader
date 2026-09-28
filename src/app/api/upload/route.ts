import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, cards } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { parseMoxfieldCSV, moxfieldRowsToCards } from "@/lib/moxfield";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const username = (formData.get("username") as string)?.trim().toLowerCase();
    const listType = formData.get("listType") as string;
    const file = formData.get("file") as File | null;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    if (listType !== "inventory" && listType !== "wishlist") {
      return NextResponse.json({ error: "listType must be inventory or wishlist" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a .csv" }, { status: 400 });
    }

    const raw = await file.text();
    let rows;
    try {
      rows = parseMoxfieldCSV(raw);
    } catch (parseErr: unknown) {
      const message = parseErr instanceof Error ? parseErr.message : "Invalid CSV format";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV appears to be empty or has no valid card rows" }, { status: 400 });
    }

    const database = db();

    // Upsert user
    let user = await database.query.users.findFirst({ where: eq(users.username, username) });
    if (!user) {
      const inserted = await database.insert(users).values({ username }).returning();
      user = inserted[0];
    }

    // Replace this user's list entirely (full re-upload model)
    await database.delete(cards).where(
      and(eq(cards.userId, user.id), eq(cards.listType, listType))
    );

    const newCards = moxfieldRowsToCards(rows, user.id, listType as "inventory" | "wishlist");
    await database.insert(cards).values(newCards);

    return NextResponse.json({ success: true, username, listType, count: rows.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
