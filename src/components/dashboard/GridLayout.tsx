import React from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ReactGridLayout = WidthProvider(RGL);

interface GridLayoutProps {
  children: React.ReactNode;
  layout: {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
  className?: string;
}

export function GridLayout({ children, layout, className }: GridLayoutProps) {
  return (
    <ReactGridLayout
      className={className}
      layout={layout}
      cols={12}
      rowHeight={100}
      isDraggable={true}
      isResizable={true}
      margin={[16, 16]}
    >
      {children}
    </ReactGridLayout>
  );
} 