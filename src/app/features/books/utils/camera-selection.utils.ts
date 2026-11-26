export type CameraFacing = 'rear' | 'front' | 'unknown';

export interface ScannerCameraDevice {
  id: string;
  label: string;
  facing: CameraFacing;
}

export interface CameraLabelTranslations {
  rearCamera: string;
  frontCamera: string;
  genericCameraPrefix: string;
}

export interface CameraSwitchPlan {
  mode: 'none' | 'facing-toggle' | 'select';
  rearCamera: ScannerCameraDevice | null;
  frontCamera: ScannerCameraDevice | null;
  cameras: ScannerCameraDevice[];
}

export interface VideoDeviceLike {
  deviceId: string;
  kind: string;
  label: string;
}

export type RawCameraDevice = VideoDeviceLike;

const DEFAULT_CAMERA_LABEL_TRANSLATIONS: CameraLabelTranslations = {
  rearCamera: 'Rear camera',
  frontCamera: 'Front camera',
  genericCameraPrefix: 'Camera',
};

const AUXILIARY_LENS_REGEX =
  /\b(depth|tof|time[- ]of[- ]flight|ir|infrared|macro|telephoto|tele|ultra[- ]?wide|ultrawide|bokeh|monochrome|mono|spatial)\b/i;

const REAR_FACING_REGEX = /\b(back|rear|environment|trasera|posterior)\b/i;
const FRONT_FACING_REGEX = /\b(front|user|selfie|facetime|frontal|delantera)\b/i;
const ANDROID_CAMERA_INDEX_REGEX = /\bcamera2?\s+(\d+)\b/i;
const USB_ID_SUFFIX_REGEX = /\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i;

/** Extracts the numeric Android Camera2 index (e.g. `camera 0` -> `0`) when present. */
export function extractCameraIndex(rawLabel: string): number | null {
  const match = ANDROID_CAMERA_INDEX_REGEX.exec(rawLabel);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Returns true when a camera label identifies a specialized auxiliary lens unsuitable for barcode scanning. */
export function isAuxiliaryCameraLabel(label: string): boolean {
  return AUXILIARY_LENS_REGEX.test(label);
}

/** Alias for `isAuxiliaryCameraLabel` matching scanner engine naming. */
export const isAuxiliaryLensLabel = isAuxiliaryCameraLabel;

/** Classifies a camera device label as rear, front, or unknown. */
export function classifyCameraFacing(label: string): CameraFacing {
  if (REAR_FACING_REGEX.test(label)) {
    return 'rear';
  }
  if (FRONT_FACING_REGEX.test(label)) {
    return 'front';
  }
  return 'unknown';
}

/** Alias for `classifyCameraFacing` matching scanner engine naming. */
export const detectCameraFacing = classifyCameraFacing;

/** Formats a raw MediaDeviceInfo label into a clean, user-friendly camera name. */
export function formatCameraLabel(
  rawLabel: string,
  index: number,
  facing: CameraFacing,
  translations: CameraLabelTranslations
): string {
  if (facing === 'rear') {
    return translations.rearCamera;
  }
  if (facing === 'front') {
    return translations.frontCamera;
  }

  const cleaned = rawLabel.replace(USB_ID_SUFFIX_REGEX, '').trim();
  if (cleaned.length > 0 && !/^camera2\s+\d+/i.test(cleaned)) {
    return cleaned;
  }

  return `${translations.genericCameraPrefix} ${index + 1}`;
}

/** Filters non-video/auxiliary devices and normalizes camera metadata for the UI. */
export function filterAndNormalizeCameras(
  devices: readonly VideoDeviceLike[],
  translations: CameraLabelTranslations = DEFAULT_CAMERA_LABEL_TRANSLATIONS
): ScannerCameraDevice[] {
  const seenIds = new Set<string>();
  const normalized: Array<{
    device: ScannerCameraDevice;
    cameraIndex: number | null;
    originalOrder: number;
  }> = [];

  for (const device of devices) {
    if (device.kind !== 'videoinput') {
      continue;
    }

    const id = device.deviceId.trim();
    if (!id || seenIds.has(id)) {
      continue;
    }

    if (isAuxiliaryCameraLabel(device.label)) {
      continue;
    }

    seenIds.add(id);
    const facing = classifyCameraFacing(device.label);
    const label = formatCameraLabel(device.label, normalized.length, facing, translations);

    normalized.push({
      device: { id, label, facing },
      cameraIndex: extractCameraIndex(device.label),
      originalOrder: normalized.length,
    });
  }

  // On Android multi-lens devices, Camera2 index 0 is the primary rear sensor and index 1 is
  // the primary front sensor. Sort ascending by index within the same facing so primary sensors
  // are always tried before higher-indexed auxiliary/virtual lenses (e.g. camera 4/5/6).
  normalized.sort((a, b) => {
    if (a.device.facing !== b.device.facing) {
      return a.originalOrder - b.originalOrder;
    }
    if (a.cameraIndex !== null && b.cameraIndex !== null && a.cameraIndex !== b.cameraIndex) {
      return a.cameraIndex - b.cameraIndex;
    }
    if (a.cameraIndex !== null && b.cameraIndex === null) {
      return -1;
    }
    if (a.cameraIndex === null && b.cameraIndex !== null) {
      return 1;
    }
    return a.originalOrder - b.originalOrder;
  });

  return normalized.map((entry) => entry.device);
}

/** Determines whether to hide switcher controls, show a 1-tap front/rear toggle, or show a desktop selector. */
export function buildCameraSwitchPlan(
  cameras: readonly ScannerCameraDevice[],
  activeDeviceId: string | null
): CameraSwitchPlan {
  const rearCameras = cameras.filter((camera) => camera.facing === 'rear');
  const frontCameras = cameras.filter((camera) => camera.facing === 'front');

  const activeRear =
    rearCameras.find((camera) => camera.id === activeDeviceId) ?? rearCameras[0] ?? null;
  const activeFront =
    frontCameras.find((camera) => camera.id === activeDeviceId) ?? frontCameras[0] ?? null;

  if (cameras.length <= 1) {
    return {
      mode: 'none',
      rearCamera: activeRear,
      frontCamera: activeFront,
      cameras: [...cameras],
    };
  }

  if (activeRear && activeFront) {
    return {
      mode: 'facing-toggle',
      rearCamera: activeRear,
      frontCamera: activeFront,
      cameras: [activeRear, activeFront],
    };
  }

  const unknownCameras = cameras.filter((camera) => camera.facing === 'unknown');
  if (unknownCameras.length === 0) {
    return {
      mode: 'none',
      rearCamera: activeRear,
      frontCamera: activeFront,
      cameras: [...cameras],
    };
  }

  return {
    mode: 'select',
    rearCamera: activeRear,
    frontCamera: activeFront,
    cameras: [...cameras],
  };
}

/**
 * Picks the primary camera device ID for the requested facing direction.
 * Honors `preferredId` immediately when it is still present and not an auxiliary lens;
 * otherwise selects the lowest-indexed Camera2 sensor matching `facing`.
 */
export function pickPrimaryDeviceId(
  devices: readonly RawCameraDevice[],
  facing: 'environment' | 'user',
  preferredId?: string | null
): string | null {
  const trimmedPreferredId = preferredId?.trim() ?? '';
  if (trimmedPreferredId.length > 0) {
    const preferredDevice = devices.find(
      (device) =>
        device.kind === 'videoinput' &&
        device.deviceId.trim() === trimmedPreferredId &&
        !isAuxiliaryCameraLabel(device.label)
    );
    if (preferredDevice) {
      return preferredDevice.deviceId.trim();
    }
  }

  const targetFacing: CameraFacing = facing === 'environment' ? 'rear' : 'front';
  const normalized = filterAndNormalizeCameras(devices);
  const match = normalized.find((camera) => camera.facing === targetFacing);
  return match?.id ?? null;
}
