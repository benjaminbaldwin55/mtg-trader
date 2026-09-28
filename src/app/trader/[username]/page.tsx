"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Card = {
  id: number;
  name: string;
  edition: string | null;
  quantity: number;
  foil: boolean;
  condition: string | null;
  language: string | null;
  listType: string;
};

type OverlapPair = {
  wishlistCard: Card;
  inventoryCard: Card;
};

type OverlapData = {
  theyHaveForYou: OverlapPair[];
  youHaveForThem: OverlapPair[];
};

export default function TraderPage() {
  const { username } = useParams<{ username: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewerInput, setViewerInput] = useState("");
  const [viewer, setViewer] = useState<string | null>(null);
  const [tab, setTab] = useState<"inventory" | "wishlist" | "overlap">("inventory");

  const [inventory, setInventory] = useState<Card[]>([]);
  const [wishlist, setWishlist] = useState<Card[]>([]);
  const [overlap, setOverlap] = useState<OverlapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [overlapLoading, setOverlapLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Load username from localStorage or query param
  useEffect(() => {
    const qViewer = searchParams.get("viewer");
    const saved = localStorage.getItem("mtg-username") ?? "";
    const v = qViewer || saved || null;
    if (v) { setViewer(v); setViewerInput(v); }
  }, [searchParams]);

  // Load trader's cards
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);
    Promise.all([
      fetch(`/api/cards?username=${encodeURIComponent(username)}&listType=inventory`).then((r) => r.json()),
      fetch(`/api/cards?username=${encodeURIComponent(username)}&listType=wishlist`).then((r) => r.json()),
    ]).then(([inv, wish]) => {
      if (inv.error === "User not found") { setNotFound(true); setLoading(false); return; }
      setInventory(Array.isArray(inv.cards) ? inv.cards : []);
      setWishlist(Array.isArray(wish.cards) ? wish.cards : []);
      setLoading(false);
    });
  }, [username]);

  // Load overlap whenever viewer changes
  useEffect(() => {
    if (!viewer || viewer.toLowerCase() === username.toLowerCase()) { setOverlap(null); return; }
    setOverlapLoading(true);
    fetch(`/api/cards/overlap?viewer=${encodeURIComponent(viewer)}&target=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => { setOverlap(data.error ? null : data); })
      .finally(() => setOverlapLoading(false));
  }, [viewer, username]);

  function applyViewer() {
    const v = viewerInput.trim().toLowerCase();
    if (!v) return;
    localStorage.setItem("mtg-username", v);
    setViewer(v);
    router.replace(`/trader/${username}?viewer=${v}`);
  }

  function filterCards(list: Card[]) {
    if (!search) return list;
    return list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }

  const isOwnProfile = viewer?.toLowerCase() === username.toLowerCase();
  const overlapCount = overlap ? overlap.theyHaveForYou.length + overlap.youHaveForThem.length : 0;

  if (notFound) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg mb-2">Trader &quot;{username}&quot; not found.</p>
        <Link href="/" className="text-amber-400 underline text-sm">← Back to traders</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 capitalize">{username}</h1>
          <Link href="/" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← All traders</Link>
        </div>
        {!isOwnProfile && (
          <div className="flex items-center gap-2">
            <input
              value={viewerInput}
              onChange={(e) => setViewerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyViewer()}
              placeholder="Your username"
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors w-36"
            />
            <button
              onClick={applyViewer}
              className="text-sm bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Compare
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {(["inventory", "wishlist"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}{" "}
            <span className="text-xs text-gray-600 ml-1">
              {t === "inventory" ? inventory.length : wishlist.length}
            </span>
          </button>
        ))}
        {viewer && !isOwnProfile && (
          <button
            onClick={() => setTab("overlap")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === "overlap"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Trades
            {overlapCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-gray-950 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {overlapCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Search */}
      {tab !== "overlap" && (
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards..."
            className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <>
          {tab === "inventory" && <CardTable cards={filterCards(inventory)} emptyMsg="No inventory uploaded yet." />}
          {tab === "wishlist" && <CardTable cards={filterCards(wishlist)} emptyMsg="No wishlist uploaded yet." />}
          {tab === "overlap" && (
            <OverlapView
              overlap={overlap}
              loading={overlapLoading}
              viewer={viewer!}
              target={username}
            />
          )}
        </>
      )}
    </div>
  );
}

function CardTable({ cards, emptyMsg }: { cards: Card[]; emptyMsg: string }) {
  if (cards.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">{emptyMsg}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-500 text-left">
            <th className="px-4 py-3 font-medium">Card</th>
            <th className="px-4 py-3 font-medium">Set</th>
            <th className="px-4 py-3 font-medium">Qty</th>
            <th className="px-4 py-3 font-medium">Condition</th>
            <th className="px-4 py-3 font-medium">Foil</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => (
            <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-900 transition-colors">
              <td className="px-4 py-2.5 font-medium text-white">{c.name}</td>
              <td className="px-4 py-2.5 text-gray-400">{c.edition || "—"}</td>
              <td className="px-4 py-2.5 text-gray-300">{c.quantity}</td>
              <td className="px-4 py-2.5 text-gray-400">{c.condition || "—"}</td>
              <td className="px-4 py-2.5">
                {c.foil && <Badge className="bg-purple-900/50 text-purple-300 border-purple-700 text-xs">Foil</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverlapView({
  overlap,
  loading,
  viewer,
  target,
}: {
  overlap: OverlapData | null;
  loading: boolean;
  viewer: string;
  target: string;
}) {
  if (loading) return <p className="text-gray-500 text-sm">Calculating trades...</p>;
  if (!overlap) return <p className="text-gray-500 text-sm py-8 text-center">Enter your username above to see trade opportunities.</p>;

  const { theyHaveForYou, youHaveForThem } = overlap;

  if (theyHaveForYou.length === 0 && youHaveForThem.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">No matching trade opportunities found.</p>;
  }

  return (
    <div className="space-y-8">
      {theyHaveForYou.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            {target} has cards you want ({theyHaveForYou.length})
          </h2>
          <OverlapTable pairs={theyHaveForYou} />
        </section>
      )}
      {youHaveForThem.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
            You have cards {target} wants ({youHaveForThem.length})
          </h2>
          <OverlapTable pairs={youHaveForThem} />
        </section>
      )}
    </div>
  );
}

function OverlapTable({ pairs }: { pairs: OverlapPair[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-500 text-left">
            <th className="px-4 py-3 font-medium">Card</th>
            <th className="px-4 py-3 font-medium">Set (in inventory)</th>
            <th className="px-4 py-3 font-medium">Qty available</th>
            <th className="px-4 py-3 font-medium">Foil</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map(({ wishlistCard, inventoryCard }) => (
            <tr key={wishlistCard.id} className="border-b border-gray-800/50 hover:bg-gray-900 transition-colors">
              <td className="px-4 py-2.5 font-medium text-white">{wishlistCard.name}</td>
              <td className="px-4 py-2.5 text-gray-400">{inventoryCard.edition || "—"}</td>
              <td className="px-4 py-2.5 text-gray-300">{inventoryCard.quantity}</td>
              <td className="px-4 py-2.5">
                {inventoryCard.foil && <Badge className="bg-purple-900/50 text-purple-300 border-purple-700 text-xs">Foil</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
