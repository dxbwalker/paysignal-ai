import React from "react";

interface Props {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }: Props) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#060b18" }}>
      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {/* Left — narrow, quiet */}
        {leftPanel && (
          <div className="w-[240px] h-full overflow-y-auto" style={{ background: "#0a1020", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
            {leftPanel}
          </div>
        )}

        {/* Center — accounts */}
        <div className="w-[320px] h-full overflow-y-auto" style={{ background: "#0d1425", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
          {centerPanel}
        </div>

        {/* Right — main content area */}
        <div className="flex-1 h-full overflow-y-auto" style={{ background: "#0f1629" }}>
          {rightPanel}
        </div>
      </div>

      {/* Bottom — minimal */}
      <div className="h-[80px] overflow-y-auto" style={{ background: "#080e1a", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        {bottomPanel}
      </div>
    </div>
  );
}
