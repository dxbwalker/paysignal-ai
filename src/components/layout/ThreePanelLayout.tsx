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
    <Separator className="group relative w-1.5 flex items-center justify-center cursor-col-resize">
      <div className="w-0.5 h-8 rounded-full bg-gray-700 group-hover:bg-brand-500 group-active:bg-brand-400 transition-colors" />
    </Separator>
  );
}

function ResizeHandleV() {
  return (
    <Separator className="group relative h-1.5 flex items-center justify-center cursor-row-resize">
      <div className="h-0.5 w-8 rounded-full bg-gray-700 group-hover:bg-brand-500 group-active:bg-brand-400 transition-colors" />
    </Separator>
  );
}

export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel, bottomPanel }: Props) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      <Group orientation="vertical" className="flex-1">
        <Panel defaultSize={75} minSize={50}>
          <Group orientation="horizontal" className="h-full">
            {/* Left Panel */}
            <Panel defaultSize={22} minSize={15} maxSize={35} collapsible>
              <div className="h-full panel-glass overflow-y-auto border-r border-white/5">
                {leftPanel}
              </div>
            </Panel>

            <ResizeHandleH />

            {/* Center Panel */}
            <Panel defaultSize={33} minSize={25}>
              <div className="h-full panel-glass overflow-y-auto border-r border-white/5">
                {centerPanel}
              </div>
            </Panel>

            <ResizeHandleH />

            {/* Right Panel */}
            <Panel defaultSize={45} minSize={30}>
              <div className="h-full panel-glass overflow-y-auto">
                {rightPanel}
              </div>
            </Panel>
          </Group>
        </Panel>

        <ResizeHandleV />

        {/* Bottom Panel — Agent Decision Stream */}
        <Panel defaultSize={25} minSize={10} maxSize={40} collapsible>
          <div className="h-full bg-surface-raised border-t border-white/5 overflow-y-auto">
            {bottomPanel}
          </div>
        </Panel>
      </Group>
    </div>
  );
}
