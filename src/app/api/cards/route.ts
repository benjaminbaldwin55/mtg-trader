import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, cards } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.toLowerCase();
  const listType = searchParams.get("listType");

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  try {
    const database = db();
    const user = await database.query.users.findFirst({ where: eq(users.username, username) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const conditions = [eq(cards.userId, user.id)];
    if (listType === "inventory" || listType === "wishlist") {
      conditions.push(eq(cards.listType, listType));
    }

    const result = await database.query.cards.findMany({
      where: and(...conditions),
      orderBy: (c, { asc }) => [asc(c.name)],
    });

    return NextResponse.json({ username, cards: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load cards" }, { status: 500 });
  }
}
