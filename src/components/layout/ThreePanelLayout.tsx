import React from "react";

interface Props {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }: Props) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Main three-panel area */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0">
        {/* Left Panel — ICP & Search Plan */}
        <div className="col-span-3 panel overflow-y-auto">
          {leftPanel}
        </div>

        {/* Center Panel — Ranked Accounts */}
        <div className="col-span-4 panel overflow-y-auto">
          {centerPanel}
        </div>

        {/* Right Panel — Account Detail */}
        <div className="col-span-5 panel overflow-y-auto">
          {rightPanel}
        </div>
      </div>

      {/* Bottom Panel — Activity Log */}
      <div className="h-44 border-t border-gray-800 bg-surface-raised overflow-y-auto">
        {bottomPanel}
      </div>
    </div>
  );
}
