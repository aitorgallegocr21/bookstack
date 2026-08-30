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
    'image/avif'
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
      throw new Error('No se pudo inicializar el contexto 2D del canvas para la imagen.');
    }

    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL(targetFormat, this.quality);
    if (!dataUrl || dataUrl === 'data:,') {
      const fallbackFormat: OptimizedImageMimeType = 'image/jpeg';
      return canvas.toDataURL(fallbackFormat, this.quality);
    }

    return dataUrl;
  }

  private validateFile(file: File): void {
    if (!(file instanceof File)) {
      throw new Error('El archivo proporcionado no es válido.');
    }

    if (!this.allowedMimeTypes.has(file.type)) {
      throw new Error(
        'Tipo de imagen no soportado. Usa JPEG, PNG, WebP o AVIF.'
      );
    }

    if (file.size > this.maxInputSizeBytes) {
      throw new Error('La imagen supera el tamaño máximo permitido de 10MB.');
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
        reject(new Error('No se pudo cargar la imagen para optimizarla.'));
      };

      image.src = objectUrl;
    });
  }

  private calculateScaledDimensions(width: number, height: number): { width: number; height: number } {
    const scale = Math.min(1, this.maxDimension / Math.max(width, height));

    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  private getPreferredOutputFormat(mimeType: string): OptimizedImageMimeType {
    if (mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/avif') {
      return 'image/webp';
    }

    return 'image/jpeg';
  }
}
