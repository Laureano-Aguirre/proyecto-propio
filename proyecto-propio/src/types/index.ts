// Tipos globales de la aplicación
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  timestamp: Date;
}

export interface EnhancedOCRResult {
  originalText: string;
  correctedText: string;
  documentType: DocumentType;
  extractedData: Record<string, any>;
  summary: string;
  confidence: number;
  timestamp: Date;
}

export interface DocumentType {
  type:
    | "invoice"
    | "recipe"
    | "handwritten"
    | "business-card"
    | "book"
    | "notes"
    | "other";
  confidence: number;
  description: string;
}

export interface OCRSettings {
  usePreprocessing: boolean;
  useSharpening: boolean;
  useUpscaling: boolean;
  ocrMode: string;
  language: string;
  useAIEnhancement: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export type Theme = "light" | "dark";

export interface AppConfig {
  apiUrl: string;
  theme: Theme;
}
