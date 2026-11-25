import { describe, expect, it } from 'vitest';
import {
  buildCameraSwitchPlan,
  classifyCameraFacing,
  extractCameraIndex,
  filterAndNormalizeCameras,
  formatCameraLabel,
  isAuxiliaryCameraLabel,
  type CameraLabelTranslations,
} from './camera-selection.utils';

const LABELS: CameraLabelTranslations = {
  rearCamera: 'Cámara trasera',
  frontCamera: 'Cámara frontal',
  genericCameraPrefix: 'Cámara',
};

describe('camera-selection.utils', () => {
  it('detects auxiliary Android lenses to exclude', () => {
    expect(isAuxiliaryCameraLabel('camera2 3, facing back (depth)')).toBe(true);
    expect(isAuxiliaryCameraLabel('Back Ultra-Wide Camera')).toBe(true);
    expect(isAuxiliaryCameraLabel('Macro Lens')).toBe(true);
    expect(isAuxiliaryCameraLabel('Telephoto 3x')).toBe(true);
    expect(isAuxiliaryCameraLabel('IR Camera')).toBe(true);
    expect(isAuxiliaryCameraLabel('camera2 0, facing back')).toBe(false);
    expect(isAuxiliaryCameraLabel('Logitech HD Webcam C920 (046d:082d)')).toBe(false);
  });

  it('classifies rear, front, and unknown camera labels', () => {
    expect(classifyCameraFacing('camera2 0, facing back')).toBe('rear');
    expect(classifyCameraFacing('Cámara trasera')).toBe('rear');
    expect(classifyCameraFacing('camera2 1, facing front')).toBe('front');
    expect(classifyCameraFacing('FaceTime HD Camera')).toBe('front');
    expect(classifyCameraFacing('Logitech C920')).toBe('unknown');
  });

  it('formats labels cleanly and strips USB vendor/product IDs', () => {
    expect(formatCameraLabel('camera2 0, facing back', 0, 'rear', LABELS)).toBe('Cámara trasera');
    expect(formatCameraLabel('camera2 1, facing front', 1, 'front', LABELS)).toBe('Cámara frontal');
    expect(formatCameraLabel('Logitech HD Webcam C920 (046d:082d)', 0, 'unknown', LABELS)).toBe(
      'Logitech HD Webcam C920'
    );
    expect(formatCameraLabel('', 2, 'unknown', LABELS)).toBe('Cámara 3');
  });

  it('filters non-video, empty-id, duplicate, and auxiliary devices', () => {
    const devices = [
      { deviceId: 'mic-1', kind: 'audioinput', label: 'Built-in Mic' },
      { deviceId: '', kind: 'videoinput', label: 'No permission yet' },
      { deviceId: 'cam-back', kind: 'videoinput', label: 'camera2 0, facing back' },
      { deviceId: 'cam-back', kind: 'videoinput', label: 'camera2 0, facing back' },
      { deviceId: 'cam-depth', kind: 'videoinput', label: 'camera2 2, facing back (depth)' },
      { deviceId: 'cam-macro', kind: 'videoinput', label: 'camera2 4, macro' },
      { deviceId: 'cam-front', kind: 'videoinput', label: 'camera2 1, facing front' },
    ];

    expect(filterAndNormalizeCameras(devices, LABELS)).toEqual([
      { id: 'cam-back', label: 'Cámara trasera', facing: 'rear' },
      { id: 'cam-front', label: 'Cámara frontal', facing: 'front' },
    ]);
  });

  it('extracts Android Camera2 numeric indices and ranks primary sensors (camera 0 / camera 1) first', () => {
    expect(extractCameraIndex('camera 0, facing back')).toBe(0);
    expect(extractCameraIndex('camera2 5, facing back')).toBe(5);
    expect(extractCameraIndex('Logitech C920')).toBeNull();

    const pocoDevices = [
      { deviceId: 'cam-5', kind: 'videoinput', label: 'camera 5, facing back' },
      { deviceId: 'cam-4', kind: 'videoinput', label: 'camera 4, facing back' },
      { deviceId: 'cam-0', kind: 'videoinput', label: 'camera 0, facing back' },
      { deviceId: 'cam-2', kind: 'videoinput', label: 'camera 2, facing back' },
      { deviceId: 'cam-6', kind: 'videoinput', label: 'camera 6, facing front' },
      { deviceId: 'cam-1', kind: 'videoinput', label: 'camera 1, facing front' },
    ];

    const normalized = filterAndNormalizeCameras(pocoDevices, LABELS);
    const rearIds = normalized.filter((c) => c.facing === 'rear').map((c) => c.id);
    const frontIds = normalized.filter((c) => c.facing === 'front').map((c) => c.id);

    expect(rearIds).toEqual(['cam-0', 'cam-2', 'cam-4', 'cam-5']);
    expect(frontIds).toEqual(['cam-1', 'cam-6']);
  });

  it('returns mode none for 0 or 1 usable camera', () => {
    expect(buildCameraSwitchPlan([], null).mode).toBe('none');
    expect(
      buildCameraSwitchPlan([{ id: 'cam-1', label: 'Webcam', facing: 'unknown' }], 'cam-1').mode
    ).toBe('none');
  });

  it('collapses mobile rear + front cameras into a 1-tap facing-toggle plan', () => {
    const plan = buildCameraSwitchPlan(
      [
        { id: 'rear-1', label: 'Cámara trasera', facing: 'rear' },
        { id: 'rear-2', label: 'Cámara trasera', facing: 'rear' },
        { id: 'front-1', label: 'Cámara frontal', facing: 'front' },
      ],
      'rear-2'
    );

    expect(plan.mode).toBe('facing-toggle');
    expect(plan.rearCamera?.id).toBe('rear-2');
    expect(plan.frontCamera?.id).toBe('front-1');
    expect(plan.cameras).toHaveLength(2);
  });

  it('hides switcher when multiple rear lenses exist without any front or unknown camera', () => {
    const plan = buildCameraSwitchPlan(
      [
        { id: 'rear-1', label: 'Cámara trasera', facing: 'rear' },
        { id: 'rear-2', label: 'Cámara trasera', facing: 'rear' },
      ],
      'rear-1'
    );

    expect(plan.mode).toBe('none');
  });

  it('returns mode select when multiple unknown desktop webcams exist', () => {
    const plan = buildCameraSwitchPlan(
      [
        { id: 'usb-1', label: 'Logitech C920', facing: 'unknown' },
        { id: 'usb-2', label: 'Elgato Facecam', facing: 'unknown' },
      ],
      'usb-1'
    );

    expect(plan.mode).toBe('select');
    expect(plan.cameras).toHaveLength(2);
  });
});
