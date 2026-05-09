import type { Mode } from "@/types";
import { useState } from "react";

export default function Home() {
  const [mode] = useState<Mode>("demo");

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-brand-400">⚡</span> PaySignal AI
          </h1>
          {mode === "demo" && (
            <span className="badge-yellow">Demo Mode</span>
          )}
        </div>
        <p className="text-gray-400">
          Evidence-backed payment complexity intelligence for sales teams.
        </p>
      </div>

      {/* Placeholder — full three-panel layout comes in Task 5 */}
      <div className="panel p-8 text-center">
        <p className="text-gray-500 text-sm">
          Dashboard loading... Phase 1 foundation complete.
        </p>
      </div>
    </main>
  );
}
