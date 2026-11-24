export type DockPosition = 'left' | 'right' | 'top' | 'bottom';
export type MobileDockPosition = 'top' | 'bottom';

export const DESKTOP_DOCK_POSITIONS: readonly DockPosition[] = ['left', 'right', 'top', 'bottom'];
export const MOBILE_DOCK_POSITIONS: readonly MobileDockPosition[] = ['bottom', 'top'];
export const MOBILE_BREAKPOINT_PX = 768;

export interface SnapPreviewRect {
  top: string;
  right: string;
  bottom: string;
  left: string;
  width: string;
  height: string;
}

/**
 * Type guard validating whether an unknown value is a supported 4-edge dock position.
 */
export function isValidDockPosition(value: unknown): value is DockPosition {
  return value === 'left' || value === 'right' || value === 'top' || value === 'bottom';
}

/**
 * Type guard validating whether an unknown value is a supported mobile dock position.
 */
export function isValidMobileDockPosition(value: unknown): value is MobileDockPosition {
  return value === 'top' || value === 'bottom';
}

/**
 * Returns the allowed dock edges for the given viewport width.
 * Mobile (< 768px) restricts docking to top and bottom; desktop supports all 4 edges.
 */
export function getAllowedDockPositions(viewportWidth: number): readonly DockPosition[] {
  return viewportWidth < MOBILE_BREAKPOINT_PX ? MOBILE_DOCK_POSITIONS : DESKTOP_DOCK_POSITIONS;
}

/**
 * Detects which viewport edge a pointer coordinate should snap to.
 * Returns null when the pointer is inside the central deadzone.
 */
export function detectSnapEdge(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  deadzone = 0
): DockPosition | null {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return null;
  }

  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const dx = x - centerX;
  const dy = y - centerY;

  if (deadzone > 0 && Math.hypot(dx, dy) < deadzone) {
    return null;
  }

  if (viewportWidth < MOBILE_BREAKPOINT_PX) {
    return dy < 0 ? 'top' : 'bottom';
  }

  const nx = dx / viewportWidth;
  const ny = dy / viewportHeight;

  if (Math.abs(nx) >= Math.abs(ny)) {
    return nx < 0 ? 'left' : 'right';
  }

  return ny < 0 ? 'top' : 'bottom';
}

/**
 * Computes fixed positioning coordinates for the translucent snap preview overlay.
 */
export function getSnapPreviewRect(
  position: DockPosition,
  isSidebarCollapsed = false
): SnapPreviewRect {
  const sidebarWidth = isSidebarCollapsed ? '68px' : '240px';

  switch (position) {
    case 'left':
      return {
        top: '12px',
        right: 'auto',
        bottom: '12px',
        left: '12px',
        width: sidebarWidth,
        height: 'calc(100dvh - 24px)',
      };
    case 'right':
      return {
        top: '12px',
        right: '12px',
        bottom: '12px',
        left: 'auto',
        width: sidebarWidth,
        height: 'calc(100dvh - 24px)',
      };
    case 'top':
      return {
        top: '12px',
        right: '16px',
        bottom: 'auto',
        left: '16px',
        width: 'auto',
        height: '56px',
      };
    case 'bottom':
      return {
        top: 'auto',
        right: '16px',
        bottom: '12px',
        left: '16px',
        width: 'auto',
        height: '56px',
      };
  }
}
