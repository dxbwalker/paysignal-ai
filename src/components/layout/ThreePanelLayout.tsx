import React from "react";

interface Props {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

/**
 * Three-panel layout with CSS grid.
 * Desktop: left (280px) | center (flex) | right (400px)
 * Mobile/tablet: stacked vertically
 * Bottom panel: agent activity log
 */
export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }: Props) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface text-gray-100">
      {/* Main three-panel area */}
      <div
        className="flex-1 min-h-0 p-3 gap-3
          flex flex-col
          lg:grid lg:grid-cols-[280px_1fr_400px]"
      >
        {/* Left Panel — ICP & Search Plan */}
        <div className="panel overflow-y-auto lg:h-full h-auto min-h-[200px] lg:min-h-0">
          {leftPanel}
        </div>

        {/* Center Panel — Ranked Accounts */}
        <div className="panel overflow-y-auto lg:h-full h-auto min-h-[300px] lg:min-h-0">
          {centerPanel}
        </div>

        {/* Right Panel — Account Detail */}
        <div className="panel overflow-y-auto lg:h-full h-auto min-h-[300px] lg:min-h-0">
          {rightPanel}
        </div>
      </div>

      {/* Bottom Panel — Activity Log */}
      <div className="h-44 shrink-0 border-t border-gray-800 bg-surface-raised overflow-hidden">
        {bottomPanel}
      </div>
    </div>
  );
}
