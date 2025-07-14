import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';
import { FiCamera, FiLoader, FiEye, FiRefreshCw, FiSettings, FiUpload, FiImage } from 'react-icons/fi';
import { preprocessImage, sharpenImage, upscaleImage } from '../utils/imageProcessing';
import './OCRCamera.css';

interface OCRResult {
  text: string;
  confidence: number;
}

interface OCRSettings {
  usePreprocessing: boolean;
  useSharpening: boolean;
  useUpscaling: boolean;
  ocrMode: string;
  language: string;
}

const OCRCamera: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('camera');
  const [settings, setSettings] = useState<OCRSettings>({
    usePreprocessing: true,
    useSharpening: false,
    useUpscaling: true,
    ocrMode: '6', // PSM_UNIFORM_BLOCK
    language: 'spa'
  });

  const processImageWithEnhancements = (imageSrc: string): string => {
    if (!settings.usePreprocessing && !settings.useSharpening && !settings.useUpscaling) {
      return imageSrc;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    return new Promise<string>((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        let processedCanvas = canvas;

        // Aplicar mejoras según configuración
        if (settings.useUpscaling) {
          processedCanvas = upscaleImage(processedCanvas, 2);
        }
        
        if (settings.usePreprocessing) {
          processedCanvas = preprocessImage(processedCanvas);
        }
        
        if (settings.useSharpening) {
          processedCanvas = sharpenImage(processedCanvas);
        }

        resolve(processedCanvas.toDataURL('image/png'));
      };
      img.src = imageSrc;
    }) as any;
  };

  const processImage = useCallback(async (imageSrc: string) => {
    setIsLoading(true);
    setIsProcessing(true);
    setError(null);
    
    try {
      // Crear worker de Tesseract con configuración optimizada
      const worker = await createWorker(settings.language, 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`Progreso OCR: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      // Configurar parámetros avanzados para mejor precisión
      await worker.setParameters({
        tessedit_pageseg_mode: parseInt(settings.ocrMode) as any,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÉÍÓÚáéíóúÑñ .,!?-',
        tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine
      });

      // Aplicar mejoras de imagen si están habilitadas
      let processedImage = imageSrc;
      if (settings.usePreprocessing || settings.useSharpening || settings.useUpscaling) {
        processedImage = await processImageWithEnhancements(imageSrc);
      }

      // Procesar la imagen
      const { data: { text, confidence } } = await worker.recognize(processedImage);
      
      setOcrResult({
        text: text.trim(),
        confidence: Math.round(confidence)
      });

      await worker.terminate();
    } catch (err) {
      setError('Error al procesar la imagen. Inténtalo de nuevo.');
      console.error('OCR Error:', err);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  }, [settings, processImageWithEnhancements]);

  const captureAndProcess = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      processImage(imageSrc);
    }
  }, [processImage]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      setUploadedImage(imageSrc);
      setInputMode('upload');
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setInputMode('camera');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processCurrentImage = () => {
    if (inputMode === 'upload' && uploadedImage) {
      processImage(uploadedImage);
    } else if (inputMode === 'camera') {
      captureAndProcess();
    }
  };

  const clearResults = () => {
    setOcrResult(null);
    setError(null);
    setUploadedImage(null);
    setInputMode('camera');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="ocr-camera">
      <div className="input-mode-selector">
        <button 
          onClick={() => setInputMode('camera')}
          className={`mode-btn ${inputMode === 'camera' ? 'active' : ''}`}
        >
          <FiCamera />
          Cámara Web
        </button>
        <button 
          onClick={() => setInputMode('upload')}
          className={`mode-btn ${inputMode === 'upload' ? 'active' : ''}`}
        >
          <FiUpload />
          Cargar Imagen
        </button>
      </div>

      {inputMode === 'camera' ? (
        <div className="camera-container">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "environment" // Usar cámara trasera en móviles
            }}
            className="webcam"
          />
          
          <div className="camera-overlay">
            <div className="focus-frame">
              <div className="corner top-left"></div>
              <div className="corner top-right"></div>
              <div className="corner bottom-left"></div>
              <div className="corner bottom-right"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="upload-container">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="file-input"
          />
          
          {uploadedImage ? (
            <div className="uploaded-image-container">
              <img 
                src={uploadedImage} 
                alt="Imagen cargada" 
                className="uploaded-image"
              />
              <button 
                onClick={clearUploadedImage}
                className="clear-image-btn"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="upload-placeholder" onClick={triggerFileUpload}>
              <FiImage className="upload-icon" />
              <h3>Seleccionar imagen</h3>
              <p>Haz clic aquí o arrastra una imagen</p>
              <p className="upload-formats">Formatos: JPG, PNG, GIF, WEBP (máx. 10MB)</p>
            </div>
          )}
        </div>
      )}

      <div className="controls">
        {inputMode === 'camera' ? (
          <button
            onClick={captureAndProcess}
            disabled={isLoading}
            className="capture-btn"
          >
            {isLoading ? (
              <>
                <FiLoader className="spinning" />
                Procesando...
              </>
            ) : (
              <>
                <FiCamera />
                Capturar y Analizar
              </>
            )}
          </button>
        ) : (
          <>
            {!uploadedImage ? (
              <button
                onClick={triggerFileUpload}
                className="upload-btn"
              >
                <FiUpload />
                Seleccionar Imagen
              </button>
            ) : (
              <button
                onClick={processCurrentImage}
                disabled={isLoading}
                className="capture-btn"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="spinning" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <FiEye />
                    Analizar Imagen
                  </>
                )}
              </button>
            )}
          </>
        )}

        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="settings-btn"
        >
          <FiSettings />
          Configuración
        </button>

        {(ocrResult || uploadedImage) && (
          <button onClick={clearResults} className="clear-btn">
            <FiRefreshCw />
            Limpiar Todo
          </button>
        )}
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h4>⚙️ Configuración OCR</h4>
          
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.usePreprocessing}
                onChange={(e) => setSettings(prev => ({ ...prev, usePreprocessing: e.target.checked }))}
              />
              Preprocesamiento (mejora contraste)
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.useUpscaling}
                onChange={(e) => setSettings(prev => ({ ...prev, useUpscaling: e.target.checked }))}
              />
              Escalado 2x (mejora resolución)
            </label>
          </div>

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={settings.useSharpening}
                onChange={(e) => setSettings(prev => ({ ...prev, useSharpening: e.target.checked }))}
              />
              Enfoque (mejora bordes)
            </label>
          </div>

          <div className="setting-group">
            <label htmlFor="language-select">Idioma:</label>
            <select 
              id="language-select"
              value={settings.language}
              onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
            >
              <option value="spa">Español</option>
              <option value="eng">Inglés</option>
              <option value="fra">Francés</option>
              <option value="deu">Alemán</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="mode-select">Modo de análisis:</label>
            <select 
              id="mode-select"
              value={settings.ocrMode}
              onChange={(e) => setSettings(prev => ({ ...prev, ocrMode: e.target.value }))}
            >
              <option value="6">Bloque uniforme (recomendado)</option>
              <option value="7">Línea de texto simple</option>
              <option value="8">Palabra simple</option>
              <option value="10">Carácter simple</option>
              <option value="3">Automático</option>
            </select>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="processing-indicator">
          <FiEye className="processing-icon" />
          <p>Analizando imagen...</p>
        </div>
      )}

      {error && (
        <div className="error-result">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {ocrResult && (
        <div className="ocr-result">
          <h3>📝 Texto Detectado:</h3>
          <div className="result-content">
            <p className="detected-text">
              {ocrResult.text || 'No se detectó texto en la imagen'}
            </p>
            <div className="confidence">
              <span>Confianza: {ocrResult.confidence}%</span>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill"
                  style={{ width: `${ocrResult.confidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="instructions">
        <h4>💡 Consejos para mejores resultados:</h4>
        <ul>
          <li>Asegúrate de que el texto esté bien iluminado</li>
          <li>Mantén la cámara estable al capturar</li>
          <li>El texto debe estar enfocado y legible</li>
          <li>Funciona mejor con texto en contraste alto</li>
          <li>Para imágenes cargadas: usa formatos JPG, PNG o WEBP</li>
          <li>Tamaño máximo de archivo: 10MB</li>
        </ul>
        
        <h4>🔧 Configuraciones recomendadas:</h4>
        <ul>
          <li><strong>Texto pequeño:</strong> Activa "Escalado 2x"</li>
          <li><strong>Imagen borrosa:</strong> Activa "Enfoque"</li>
          <li><strong>Bajo contraste:</strong> Activa "Preprocesamiento"</li>
          <li><strong>Múltiples líneas:</strong> Usa "Bloque uniforme"</li>
          <li><strong>Una palabra:</strong> Usa "Palabra simple"</li>
        </ul>

        <h4>📱 Métodos de entrada:</h4>
        <ul>
          <li><strong>Cámara Web:</strong> Captura en tiempo real, ideal para documentos físicos</li>
          <li><strong>Cargar Imagen:</strong> Procesa archivos guardados, perfecto para screenshots</li>
        </ul>
      </div>
    </div>
  );
};

export default OCRCamera;
