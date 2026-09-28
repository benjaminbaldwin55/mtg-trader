"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type UserSummary = {
  id: number;
  username: string;
  createdAt: string;
  inventoryCount: number;
  wishlistCount: number;
};

export default function Home() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUsername, setMyUsername] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("mtg-username") ?? "";
    setMyUsername(saved);
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-400 mb-1">Traders</h1>
        <p className="text-gray-400 text-sm">
          Browse inventories and wishlists. Click a trader to see what you can swap.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">No traders yet.</p>
          <p className="text-sm">
            Be the first —{" "}
            <Link href="/upload" className="text-amber-400 underline">
              upload your cards
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <Link
              key={u.id}
              href={`/trader/${u.username}${myUsername ? `?viewer=${myUsername}` : ""}`}
              className="block bg-gray-900 border border-gray-800 hover:border-amber-500 rounded-xl p-5 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg text-white group-hover:text-amber-400 transition-colors">
                  {u.username}
                </span>
                {myUsername === u.username && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500 text-xs">
                    you
                  </Badge>
                )}
              </div>
              <div className="flex gap-3 text-sm text-gray-400">
                <span>
                  <span className="text-white font-medium">{u.inventoryCount}</span> in inventory
                </span>
                <span>
                  <span className="text-white font-medium">{u.wishlistCount}</span> on wishlist
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
