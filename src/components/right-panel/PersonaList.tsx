import type { Account } from "@/types";

export function PersonaList({ account }: { account: Account }) {
  if (account.personas.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No buyer personas identified.</p>
        <p className="text-gray-600 text-xs mt-1">
          Recommended titles: CFO, Head of Payments, VP Finance Operations
        </p>
      </div>
    );
  }

  const sorted = [...account.personas].sort((a, b) => a.relevanceRank - b.relevanceRank);

  return (
    <div className="space-y-3">
      {sorted.map((persona) => (
        <div key={persona.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">{persona.name}</h4>
              <p className="text-xs text-brand-400">{persona.title}</p>
            </div>
            <span className="text-[10px] text-gray-600 font-mono bg-gray-800 px-1.5 py-0.5 rounded">
              #{persona.relevanceRank}
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{persona.relevanceExplanation}</p>

          {/* Contact info */}
          {(persona.email || persona.phone || persona.linkedinUrl) && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-700/50 flex-wrap">
              {persona.email && (
                <a
                  href={`mailto:${persona.email}`}
                  className="text-[10px] text-green-400 hover:underline"
                >
                  ✉ {persona.email}
                </a>
              )}
              {persona.phone && (
                <a
                  href={`tel:${persona.phone}`}
                  className="text-[10px] text-green-400 hover:underline"
                >
                  ☎ {persona.phone}
                </a>
              )}
              {persona.linkedinUrl && (
                <a
                  href={persona.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  LinkedIn →
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
