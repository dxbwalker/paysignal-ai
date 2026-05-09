import React from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

interface Props {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
}

function ResizeHandleH() {
  return (
    <Separator className="group relative w-2 flex items-center justify-center cursor-col-resize hover:bg-brand-500/5 transition-colors">
      <div className="w-[2px] h-10 rounded-full bg-gray-700 group-hover:bg-brand-500 group-active:bg-brand-400 transition-colors" />
    </Separator>
  );
}

function ResizeHandleV() {
  return (
    <Separator className="group relative h-2 flex items-center justify-center cursor-row-resize hover:bg-brand-500/5 transition-colors">
      <div className="h-[2px] w-10 rounded-full bg-gray-700 group-hover:bg-brand-500 group-active:bg-brand-400 transition-colors" />
    </Separator>
  );
}

export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }: Props) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--surface, #0a0e1a)" }}>
      <Group orientation="vertical" style={{ flex: 1 }}>
        <Panel defaultSize={78} minSize={50}>
          <div style={{ height: "100%", display: "flex" }}>
            <Group orientation="horizontal" style={{ width: "100%", height: "100%" }}>
              {/* Left Panel — ICP & Search Plan */}
              <Panel defaultSize={24} minSize={18} maxSize={35}>
                <div className="h-full overflow-y-auto border-r border-white/5 bg-surface-raised/50">
                  {leftPanel}
                </div>
              </Panel>

              <ResizeHandleH />

              {/* Center Panel — Ranked Accounts */}
              <Panel defaultSize={34} minSize={25}>
                <div className="h-full overflow-y-auto border-r border-white/5 bg-surface-raised/30">
                  {centerPanel}
                </div>
              </Panel>

              <ResizeHandleH />

              {/* Right Panel — Account Detail */}
              <Panel defaultSize={42} minSize={30}>
                <div className="h-full overflow-y-auto bg-surface-raised/20">
                  {rightPanel}
                </div>
              </Panel>
            </Group>
          </div>
        </Panel>

        <ResizeHandleV />

        {/* Bottom Panel — Agent Decision Stream */}
        <Panel defaultSize={22} minSize={8} maxSize={40}>
          <div className="h-full overflow-y-auto border-t border-white/5 bg-surface-raised">
            {bottomPanel}
          </div>
        </Panel>
      </Group>
    </div>
  );
}
