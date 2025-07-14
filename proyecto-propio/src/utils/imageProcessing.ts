// Utilidades para preprocesamiento de imágenes
export const preprocessImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convertir a escala de grises y aumentar contraste
  for (let i = 0; i < data.length; i += 4) {
    // Escala de grises
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    
    // Aumentar contraste (threshold)
    const threshold = 128;
    const newValue = gray > threshold ? 255 : 0;
    
    data[i] = newValue;     // R
    data[i + 1] = newValue; // G
    data[i + 2] = newValue; // B
    // data[i + 3] se mantiene (alpha)
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

export const sharpenImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Kernel de sharpening
  const sharpenKernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];

  const newData = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[pixel] * sharpenKernel[ky + 1][kx + 1];
          }
        }
        newData[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  const newImageData = new ImageData(newData, width, height);
  ctx.putImageData(newImageData, 0, 0);
  return canvas;
};

export const upscaleImage = (canvas: HTMLCanvasElement, scale: number = 2): HTMLCanvasElement => {
  const newCanvas = document.createElement('canvas');
  const newCtx = newCanvas.getContext('2d')!;
  
  newCanvas.width = canvas.width * scale;
  newCanvas.height = canvas.height * scale;
  
  // Usar filtro de interpolación para mejor calidad
  newCtx.imageSmoothingEnabled = false;
  newCtx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
  
  return newCanvas;
};
