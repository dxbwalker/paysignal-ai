import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface Props {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

function ResizeHandle({ direction = "horizontal" }: { direction?: "horizontal" | "vertical" }) {
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center ${
        direction === "horizontal" ? "w-1.5" : "h-1.5"
      }`}
    >
      <div
        className={`rounded-full bg-gray-700 group-hover:bg-brand-500 group-active:bg-brand-400 transition-colors ${
          direction === "horizontal" ? "w-0.5 h-8" : "h-0.5 w-8"
        }`}
      />
    </PanelResizeHandle>
  );
}

export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }: Props) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      {/* Main horizontal panels */}
      <PanelGroup direction="vertical" className="flex-1">
        <Panel defaultSize={75} minSize={50}>
          <PanelGroup direction="horizontal" className="h-full">
            {/* Left Panel — ICP & Search Plan */}
            <Panel defaultSize={22} minSize={15} maxSize={35} collapsible>
              <div className="h-full panel-glass overflow-y-auto border-r border-white/5">
                {leftPanel}
              </div>
            </Panel>

            <ResizeHandle />

            {/* Center Panel — Ranked Accounts */}
            <Panel defaultSize={33} minSize={25}>
              <div className="h-full panel-glass overflow-y-auto border-r border-white/5">
                {centerPanel}
              </div>
            </Panel>

            <ResizeHandle />

            {/* Right Panel — Account Detail */}
            <Panel defaultSize={45} minSize={30}>
              <div className="h-full panel-glass overflow-y-auto">
                {rightPanel}
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <ResizeHandle direction="vertical" />

        {/* Bottom Panel — Agent Decision Stream */}
        <Panel defaultSize={25} minSize={10} maxSize={40} collapsible>
          <div className="h-full bg-surface-raised border-t border-white/5 overflow-y-auto">
            {bottomPanel}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
