import React from "react";

interface Props {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }: Props) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      {/* Main three-panel area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel — ICP & Search Plan (hidden in presentation mode) */}
        {leftPanel && (
          <div className="w-[280px] min-w-[280px] h-full overflow-y-auto border-r border-white/5 bg-surface-raised/50">
            {leftPanel}
          </div>
        )}

        {/* Center Panel — Ranked Accounts */}
        <div className={`${leftPanel ? "w-[380px] min-w-[320px]" : "w-[340px] min-w-[300px]"} h-full overflow-y-auto border-r border-white/5 bg-surface-raised/30`}>
          {centerPanel}
        </div>

        {/* Right Panel — Account Detail (fills remaining space) */}
        <div className="flex-1 h-full overflow-y-auto bg-surface-raised/20">
          {rightPanel}
        </div>
      </div>

      {/* Bottom Panel — Agent Decision Stream (compact by default) */}
      <div className="h-[120px] min-h-[80px] overflow-y-auto border-t border-white/5 bg-surface-raised">
        {bottomPanel}
      </div>
    </div>
  );
}
