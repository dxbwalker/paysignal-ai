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
        {/* Left Panel — ICP & Search Plan */}
        <div className="w-[280px] min-w-[280px] h-full overflow-y-auto border-r border-white/5 bg-surface-raised/50">
          {leftPanel}
        </div>

        {/* Center Panel — Ranked Accounts */}
        <div className="w-[380px] min-w-[320px] h-full overflow-y-auto border-r border-white/5 bg-surface-raised/30">
          {centerPanel}
        </div>

        {/* Right Panel — Account Detail (fills remaining space) */}
        <div className="flex-1 h-full overflow-y-auto bg-surface-raised/20">
          {rightPanel}
        </div>
      </div>

      {/* Bottom Panel — Agent Activity Log */}
      <div className="h-[180px] min-h-[120px] overflow-y-auto border-t border-white/5 bg-surface-raised">
        {bottomPanel}
      </div>
    </div>
  );
}
