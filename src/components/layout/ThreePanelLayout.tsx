import React from "react";

interface Props {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }: Props) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--surface)" }}>
      {/* Main panels */}
      <div className="flex-1 flex min-h-0">
        {/* Left */}
        {leftPanel && (
          <div className="w-[280px] min-w-[280px] h-full overflow-y-auto panel-surface">
            {leftPanel}
          </div>
        )}

        {/* Center */}
        <div className={`${leftPanel ? "w-[360px]" : "w-[320px]"} min-w-[300px] h-full overflow-y-auto panel-surface`}>
          {centerPanel}
        </div>

        {/* Right */}
        <div className="flex-1 h-full overflow-y-auto" style={{ background: "var(--surface-raised)" }}>
          {rightPanel}
        </div>
      </div>

      {/* Bottom */}
      <div className="h-[110px] overflow-y-auto" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        {bottomPanel}
      </div>
    </div>
  );
}
