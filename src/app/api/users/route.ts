import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, cards } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db()
      .select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
        inventoryCount: sql<number>`count(case when ${cards.listType} = 'inventory' then 1 end)`,
        wishlistCount: sql<number>`count(case when ${cards.listType} = 'wishlist' then 1 end)`,
      })
      .from(users)
      .leftJoin(cards, eq(cards.userId, users.id))
      .groupBy(users.id, users.username, users.createdAt)
      .orderBy(users.username);

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
