import { Injectable } from '@angular/core';

export type OptimizedImageMimeType = 'image/webp' | 'image/jpeg';

@Injectable({ providedIn: 'root' })
export class ImageOptimizerService {
  private readonly maxInputSizeBytes = 10 * 1024 * 1024;
  private readonly maxDimension = 400;
  private readonly quality = 0.75;
  private readonly allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
  ]);

  async optimize(file: File): Promise<string> {
    this.validateFile(file);

    const image = await this.loadImage(file);
    const targetFormat = this.getPreferredOutputFormat(file.type);
    const { width, height } = this.calculateScaledDimensions(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context for cover optimization.');
    }

    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL(targetFormat, this.quality);
    if (!dataUrl || dataUrl === 'data:,') {
      const fallbackFormat: OptimizedImageMimeType = 'image/jpeg';
      return canvas.toDataURL(fallbackFormat, this.quality);
    }

    return dataUrl;
  }

  /**
   * Fetches a remote HTTPS cover image without credentials or referrer and optimizes it
   * into a local compressed WebP/JPEG data URL. Returns an empty string on timeout,
   * invalid MIME type (e.g. SVG), CORS, or network errors so persisted covers remain self-contained.
   */
  async optimizeRemoteUrl(remoteUrl: string, timeoutMs = 6000): Promise<string> {
    const trimmed = remoteUrl.trim();
    if (!trimmed.startsWith('https://')) {
      throw new Error('Remote cover URL must use HTTPS.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(trimmed, {
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });

      if (!response.ok) {
        return '';
      }

      const blob = await response.blob();
      const mimeType = blob.type.toLowerCase();
      if (!mimeType.startsWith('image/') || mimeType === 'image/svg+xml') {
        return '';
      }

      const file = new File([blob], 'remote-cover', { type: mimeType });

      return await this.optimize(file);
    } catch {
      return '';
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private validateFile(file: File): void {
    if (!(file instanceof File)) {
      throw new Error('The provided file is not valid.');
    }

    if (!this.allowedMimeTypes.has(file.type)) {
      throw new Error('Unsupported image format. Use JPEG, PNG, WebP, or AVIF.');
    }

    if (file.size > this.maxInputSizeBytes) {
      throw new Error('Image exceeds the maximum allowed size of 10MB.');
    }
  }

  private async loadImage(file: File): Promise<HTMLImageElement> {
    const objectUrl = URL.createObjectURL(file);

    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not load image for optimization.'));
      };

      image.src = objectUrl;
    });
  }

  private calculateScaledDimensions(
    width: number,
    height: number
  ): { width: number; height: number } {
    const scale = Math.min(1, this.maxDimension / Math.max(width, height));

    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
  }

  private getPreferredOutputFormat(mimeType: string): OptimizedImageMimeType {
    if (mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/avif') {
      return 'image/webp';
    }

    return 'image/jpeg';
  }
}
