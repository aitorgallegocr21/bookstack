import {
  detectSnapEdge,
  getAllowedDockPositions,
  getSnapPreviewRect,
  isValidDockPosition,
  isValidMobileDockPosition,
} from './dock-snap.utils';

describe('dock-snap.utils', () => {
  it('validates desktop and mobile dock positions', () => {
    expect(isValidDockPosition('left')).toBe(true);
    expect(isValidDockPosition('right')).toBe(true);
    expect(isValidDockPosition('top')).toBe(true);
    expect(isValidDockPosition('bottom')).toBe(true);
    expect(isValidDockPosition('center')).toBe(false);
    expect(isValidDockPosition(null)).toBe(false);

    expect(isValidMobileDockPosition('top')).toBe(true);
    expect(isValidMobileDockPosition('bottom')).toBe(true);
    expect(isValidMobileDockPosition('left')).toBe(false);
  });

  it('restricts allowed dock positions on viewports narrower than 768px', () => {
    expect(getAllowedDockPositions(375)).toEqual(['bottom', 'top']);
    expect(getAllowedDockPositions(767)).toEqual(['bottom', 'top']);
    expect(getAllowedDockPositions(768)).toEqual(['left', 'right', 'top', 'bottom']);
    expect(getAllowedDockPositions(1280)).toEqual(['left', 'right', 'top', 'bottom']);
  });

  it('detects all four quadrants on desktop viewports', () => {
    const w = 1200;
    const h = 800;

    expect(detectSnapEdge(80, 400, w, h)).toBe('left');
    expect(detectSnapEdge(1120, 400, w, h)).toBe('right');
    expect(detectSnapEdge(600, 60, w, h)).toBe('top');
    expect(detectSnapEdge(600, 740, w, h)).toBe('bottom');
  });

  it('detects only top and bottom on mobile viewports (< 768px)', () => {
    const w = 375;
    const h = 812;

    expect(detectSnapEdge(20, 200, w, h)).toBe('top');
    expect(detectSnapEdge(350, 650, w, h)).toBe('bottom');
  });

  it('returns null inside the central deadzone and for invalid viewport dimensions', () => {
    expect(detectSnapEdge(600, 400, 1200, 800, 80)).toBeNull();
    expect(detectSnapEdge(630, 430, 1200, 800, 80)).toBeNull();
    expect(detectSnapEdge(100, 400, 1200, 800, 80)).toBe('left');
    expect(detectSnapEdge(100, 100, 0, 800)).toBeNull();
    expect(detectSnapEdge(100, 100, 800, 0)).toBeNull();
  });

  it('returns expected snap preview rects for each edge and collapsed state', () => {
    expect(getSnapPreviewRect('left', false)).toMatchObject({
      left: '12px',
      width: '240px',
    });
    expect(getSnapPreviewRect('right', true)).toMatchObject({
      right: '12px',
      width: '68px',
    });
    expect(getSnapPreviewRect('top')).toMatchObject({
      top: '12px',
      height: '56px',
    });
    expect(getSnapPreviewRect('bottom')).toMatchObject({
      bottom: '12px',
      height: '56px',
    });
  });
});
