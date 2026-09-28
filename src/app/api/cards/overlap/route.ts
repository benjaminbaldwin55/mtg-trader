import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, cards } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// Returns cards that viewer has on their wishlist AND targetUser has in their inventory
// Also returns the reverse: cards target has on their wishlist that viewer has in inventory
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const viewerUsername = searchParams.get("viewer")?.toLowerCase();
  const targetUsername = searchParams.get("target")?.toLowerCase();

  if (!viewerUsername || !targetUsername) {
    return NextResponse.json({ error: "viewer and target params required" }, { status: 400 });
  }
  if (viewerUsername === targetUsername) {
    return NextResponse.json({ theyHaveForYou: [], youHaveForThem: [] });
  }

  try {
    const database = db();
    const [viewer, target] = await Promise.all([
      database.query.users.findFirst({ where: eq(users.username, viewerUsername) }),
      database.query.users.findFirst({ where: eq(users.username, targetUsername) }),
    ]);

    if (!viewer || !target) {
      return NextResponse.json({ error: "One or both users not found" }, { status: 404 });
    }

    const [viewerWishlist, targetInventory, viewerInventory, targetWishlist] = await Promise.all([
      database.query.cards.findMany({ where: and(eq(cards.userId, viewer.id), eq(cards.listType, "wishlist")) }),
      database.query.cards.findMany({ where: and(eq(cards.userId, target.id), eq(cards.listType, "inventory")) }),
      database.query.cards.findMany({ where: and(eq(cards.userId, viewer.id), eq(cards.listType, "inventory")) }),
      database.query.cards.findMany({ where: and(eq(cards.userId, target.id), eq(cards.listType, "wishlist")) }),
    ]);

    // Cards viewer wants that target owns
    const theyHaveForYou = viewerWishlist
      .map((wish) => {
        const match = targetInventory.find(
          (inv) => inv.name.toLowerCase() === wish.name.toLowerCase()
        );
        return match ? { wishlistCard: wish, inventoryCard: match } : null;
      })
      .filter(Boolean);

    // Cards target wants that viewer owns
    const youHaveForThem = targetWishlist
      .map((wish) => {
        const match = viewerInventory.find(
          (inv) => inv.name.toLowerCase() === wish.name.toLowerCase()
        );
        return match ? { wishlistCard: wish, inventoryCard: match } : null;
      })
      .filter(Boolean);

    return NextResponse.json({ theyHaveForYou, youHaveForThem });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to compute overlaps" }, { status: 500 });
  }
}
