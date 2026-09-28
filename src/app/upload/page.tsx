"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [listType, setListType] = useState<"inventory" | "wishlist">("inventory");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mtg-username") ?? "";
    if (saved) setUsername(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !username.trim()) return;

    setState("uploading");
    setMessage("");

    const fd = new FormData();
    fd.append("username", username.trim());
    fd.append("listType", listType);
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Upload failed");
        return;
      }
      localStorage.setItem("mtg-username", username.trim().toLowerCase());
      setState("success");
      setMessage(`Uploaded ${data.count} cards to your ${listType}.`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) {
      setFile(dropped);
      setState("idle");
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-amber-400 mb-1">Upload Cards</h1>
      <p className="text-gray-400 text-sm mb-8">
        Export your collection from{" "}
        <span className="text-gray-300">Moxfield</span> and upload the CSV here.
        Re-uploading replaces your existing list.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Your username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. croc"
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces. This is how others will find you.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            List type
          </label>
          <div className="flex gap-3">
            {(["inventory", "wishlist"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setListType(t)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  listType === t
                    ? "bg-amber-500 border-amber-500 text-gray-950"
                    : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CSV file
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl px-6 py-10 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-amber-400 bg-amber-500/5"
                : file
                ? "border-green-500 bg-green-500/5"
                : "border-gray-700 hover:border-gray-500"
            }`}
          >
            {file ? (
              <p className="text-green-400 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-gray-400">Drop your CSV here or click to browse</p>
                <p className="text-gray-600 text-xs mt-1">.csv files only</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setState("idle"); }
              }}
            />
          </div>
        </div>

        {message && (
          <div className={`text-sm rounded-lg px-4 py-3 ${state === "error" ? "bg-red-900/30 text-red-400 border border-red-800" : "bg-green-900/30 text-green-400 border border-green-800"}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || !username.trim() || state === "uploading"}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-semibold py-3 rounded-lg transition-colors"
        >
          {state === "uploading" ? "Uploading..." : "Upload"}
        </button>

        {state === "success" && (
          <button
            type="button"
            onClick={() => router.push(`/trader/${username.trim().toLowerCase()}`)}
            className="w-full border border-amber-500 text-amber-400 hover:bg-amber-500/10 font-medium py-3 rounded-lg transition-colors"
          >
            View my profile →
          </button>
        )}
      </form>
    </div>
  );
}
