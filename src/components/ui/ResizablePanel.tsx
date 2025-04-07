import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ResizablePanelGroupProps {
  children: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  className?: string;
}

export function ResizablePanelGroup({
  children,
  direction,
  className,
}: ResizablePanelGroupProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {React.Children.map(children, (child, index) => {
        if (index === React.Children.count(children) - 1) {
          return child;
        }

        return (
          <>
            {child}
            <ResizeHandle direction={direction} />
          </>
        );
      })}
    </div>
  );
}

interface ResizablePanelProps {
  children?: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

export function ResizablePanel({
  children,
  defaultSize = 33.33,
  minSize = 10,
  maxSize = 90,
  className,
}: ResizablePanelProps) {
  return (
    <div
      className={cn('relative h-full', className)}
      style={{ flexBasis: `${defaultSize}%`, minWidth: `${minSize}%`, maxWidth: `${maxSize}%` }}
    >
      {children}
    </div>
  );
}

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
}

export function ResizeHandle({ direction }: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<number>(0);
  const startSizesRef = useRef<number[]>([]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    setIsResizing(true);
    
    // Record initial position
    if (direction === 'horizontal') {
      startPosRef.current = e.clientX;
    } else {
      startPosRef.current = e.clientY;
    }
    
    // Record initial sizes of previous and next panels
    const handle = handleRef.current;
    if (handle) {
      const prevPanel = handle.previousElementSibling as HTMLElement;
      const nextPanel = handle.nextElementSibling as HTMLElement;
      
      if (prevPanel && nextPanel) {
        startSizesRef.current = [
          prevPanel.getBoundingClientRect().width,
          nextPanel.getBoundingClientRect().width
        ];
      }
    }
    
    // Add event listeners for mouse move and up
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const handle = handleRef.current;
    if (!handle) return;
    
    const prevPanel = handle.previousElementSibling as HTMLElement;
    const nextPanel = handle.nextElementSibling as HTMLElement;
    
    if (!prevPanel || !nextPanel) return;
    
    // Calculate how far mouse has moved
    let delta: number;
    if (direction === 'horizontal') {
      delta = e.clientX - startPosRef.current;
    } else {
      delta = e.clientY - startPosRef.current;
    }
    
    // Calculate new sizes
    const prevPanelRect = prevPanel.getBoundingClientRect();
    const nextPanelRect = nextPanel.getBoundingClientRect();
    
    const totalSize = prevPanelRect.width + nextPanelRect.width;
    const minSize = totalSize * 0.1; // 10% minimum
    
    let newPrevSize = startSizesRef.current[0] + delta;
    let newNextSize = startSizesRef.current[1] - delta;
    
    // Apply constraints
    if (newPrevSize < minSize) {
      newPrevSize = minSize;
      newNextSize = totalSize - minSize;
    } else if (newNextSize < minSize) {
      newNextSize = minSize;
      newPrevSize = totalSize - minSize;
    }
    
    // Apply new sizes as percentages
    const prevPercent = (newPrevSize / totalSize) * 100;
    const nextPercent = (newNextSize / totalSize) * 100;
    
    prevPanel.style.flexBasis = `${prevPercent}%`;
    nextPanel.style.flexBasis = `${nextPercent}%`;
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={handleRef}
      className={cn(
        'flex items-center justify-center',
        direction === 'horizontal'
          ? 'h-full w-1 cursor-col-resize'
          : 'h-1 w-full cursor-row-resize',
        isResizing ? 'bg-blue-500' : 'hover:bg-blue-200'
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          'bg-blue-600 opacity-0 transition-opacity group-hover:opacity-100',
          direction === 'horizontal' ? 'h-8 w-1' : 'h-1 w-8'
        )}
      />
    </div>
  );
} 