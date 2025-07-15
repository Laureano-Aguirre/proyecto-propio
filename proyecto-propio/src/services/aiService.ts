// Servicio unificado de IA que puede usar OpenAI, Hugging Face o funcionar sin IA
import { openaiService } from "./openaiService";
import { huggingFaceService } from "./huggingFaceService";
import type {
  EnhancedOCRResult,
  DocumentType,
  WazeAlert,
  WazeJam,
  WazeAnalysis,
} from "./huggingFaceService";

export type AIProvider = "openai" | "huggingface" | "none";

export class UnifiedAIService {
  private currentProvider: AIProvider = "none";

  constructor() {
    this.detectBestProvider();
    // Asegurar que usamos Hugging Face si está disponible
    if (huggingFaceService.isAIAvailable()) {
      this.forceHuggingFace();
    }
  }

  /**
   * Detecta el mejor proveedor de IA disponible
   */
  private detectBestProvider(): void {
    // Priorizar Hugging Face sobre OpenAI (gratuito)
    if (huggingFaceService.isAIAvailable()) {
      this.currentProvider = "huggingface";
      console.log("� Usando Hugging Face como proveedor de IA (gratuito)");
    } else if (openaiService.isAIAvailable()) {
      this.currentProvider = "openai";
      console.log("� Usando OpenAI como proveedor de IA");
    } else {
      this.currentProvider = "none";
      console.log(
        "⚠️ No hay proveedores de IA configurados - usando análisis básico"
      );
    }
  }

  /**
   * Cambia el proveedor de IA manualmente
   */
  setProvider(provider: AIProvider): void {
    this.currentProvider = provider;
    console.log(`🔄 Cambiando a proveedor: ${provider}`);
  }

  /**
   * Fuerza el uso de Hugging Face (gratuito)
   */
  forceHuggingFace(): void {
    this.currentProvider = "huggingface";
    console.log("🤗 Forzando uso de Hugging Face (gratuito)");
  }

  /**
   * Obtiene el proveedor actual
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Verifica si hay IA disponible
   */
  isAIAvailable(): boolean {
    switch (this.currentProvider) {
      case "openai":
        return openaiService.isAIAvailable();
      case "huggingface":
        return huggingFaceService.isAIAvailable();
      default:
        return false;
    }
  }

  /**
   * Prueba la conexión con el proveedor actual
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    provider: AIProvider;
  }> {
    let result;

    switch (this.currentProvider) {
      case "openai":
        result = await openaiService.testConnection();
        break;
      case "huggingface":
        result = await huggingFaceService.testConnection();
        break;
      default:
        result = {
          success: false,
          message: "No hay proveedores de IA configurados",
        };
    }

    return {
      ...result,
      provider: this.currentProvider,
    };
  }

  /**
   * Mejora el resultado OCR usando el proveedor disponible
   */
  async enhanceOCRResult(
    text: string,
    language: string = "es"
  ): Promise<EnhancedOCRResult> {
    try {
      switch (this.currentProvider) {
        case "openai":
          const openaiResult = await openaiService.enhanceOCRResult(
            text,
            language
          );
          return { ...openaiResult, timestamp: new Date() };
        case "huggingface":
          return await huggingFaceService.enhanceOCRResult(text, language);
        default:
          return this.getBasicOCRResult(text);
      }
    } catch (error) {
      console.error("Error mejorando resultado OCR:", error);
      return this.getBasicOCRResult(text);
    }
  }

  /**
   * Resultado OCR básico cuando no hay IA
   */
  private getBasicOCRResult(text: string): EnhancedOCRResult {
    return {
      originalText: text,
      correctedText: text,
      documentType: this.getBasicDocumentType(text),
      extractedData: this.getBasicExtractedData(text),
      summary: this.getBasicSummary(text),
      confidence: 0.7,
      timestamp: new Date(),
    };
  }

  private getBasicDocumentType(text: string): DocumentType {
    const lower = text.toLowerCase();
    if (
      lower.includes("total") ||
      lower.includes("$") ||
      lower.includes("invoice")
    ) {
      return {
        type: "invoice",
        confidence: 0.6,
        description: "Posible factura",
      };
    }
    if (lower.includes("ingredients") || lower.includes("recipe")) {
      return { type: "recipe", confidence: 0.6, description: "Posible receta" };
    }
    if (
      lower.includes("@") ||
      lower.includes("phone") ||
      lower.includes("tel")
    ) {
      return {
        type: "business-card",
        confidence: 0.6,
        description: "Posible tarjeta de negocio",
      };
    }
    return { type: "other", confidence: 0.5, description: "Documento general" };
  }

  private getBasicExtractedData(text: string): Record<string, any> {
    const emails =
      text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [];
    const prices = text.match(/\$\d+\.?\d*/g) || [];

    return {
      content: text,
      emails: emails,
      phones: phones,
      prices: prices,
      wordCount: text.split(" ").length,
      provider: "basic",
    };
  }

  private getBasicSummary(text: string): string {
    const words = text.split(" ").slice(0, 20);
    return words.join(" ") + (text.split(" ").length > 20 ? "..." : "");
  }

  /**
   * Corrige errores de OCR
   */
  async correctOCRErrors(
    text: string,
    language: string = "es"
  ): Promise<string> {
    try {
      switch (this.currentProvider) {
        case "openai":
          return await openaiService.correctOCRErrors(text, language);
        case "huggingface":
          return await huggingFaceService.correctOCRErrors(text, language);
        default:
          return text; // Sin corrección si no hay IA
      }
    } catch (error) {
      console.error("Error corrigiendo OCR:", error);
      return text;
    }
  }

  /**
   * Clasifica el documento
   */
  async classifyDocument(text: string): Promise<DocumentType> {
    try {
      switch (this.currentProvider) {
        case "openai":
          return await openaiService.classifyDocument(text);
        case "huggingface":
          return await huggingFaceService.classifyDocument(text);
        default:
          return this.getBasicDocumentType(text);
      }
    } catch (error) {
      console.error("Error clasificando documento:", error);
      return this.getBasicDocumentType(text);
    }
  }

  /**
   * Genera un resumen
   */
  async generateSummary(
    text: string,
    maxLength: number = 100
  ): Promise<string> {
    try {
      switch (this.currentProvider) {
        case "openai":
          return await openaiService.generateSummary(text, maxLength);
        case "huggingface":
          return await huggingFaceService.generateSummary(text, maxLength);
        default:
          return this.getBasicSummary(text);
      }
    } catch (error) {
      console.error("Error generando resumen:", error);
      return this.getBasicSummary(text);
    }
  }

  // ======================================
  // 🚦 ANÁLISIS DE WAZE
  // ======================================

  /**
   * Analiza datos de tráfico de Waze
   */
  async analyzeTrafficData(wazeData: {
    alerts: WazeAlert[];
    jams: WazeJam[];
  }): Promise<WazeAnalysis> {
    try {
      switch (this.currentProvider) {
        case "openai":
          return await openaiService.analyzeTrafficData(wazeData);
        case "huggingface":
          return await huggingFaceService.analyzeTrafficData(wazeData);
        default:
          return await huggingFaceService.analyzeTrafficData(wazeData); // Análisis básico
      }
    } catch (error) {
      console.error("Error analizando tráfico:", error);
      return await huggingFaceService.analyzeTrafficData(wazeData); // Fallback
    }
  }

  /**
   * Predice problemas de tráfico
   */
  async predictTrafficProblems(
    historicalData: WazeAlert[],
    timeFrame: string = "24h"
  ): Promise<any> {
    try {
      switch (this.currentProvider) {
        case "openai":
          return await openaiService.predictTrafficProblems(
            historicalData,
            timeFrame
          );
        case "huggingface":
          return await huggingFaceService.predictTrafficProblems();
        default:
          return await huggingFaceService.predictTrafficProblems();
      }
    } catch (error) {
      console.error("Error prediciendo tráfico:", error);
      return await huggingFaceService.predictTrafficProblems();
    }
  }

  /**
   * Genera rutas optimizadas
   */
  async generateOptimalRoutes(
    from: string,
    to: string,
    currentTraffic: WazeAlert[]
  ): Promise<any> {
    try {
      switch (this.currentProvider) {
        case "openai":
          return await openaiService.generateOptimalRoutes(
            from,
            to,
            currentTraffic
          );
        case "huggingface":
          return await huggingFaceService.generateOptimalRoutes();
        default:
          return await huggingFaceService.generateOptimalRoutes();
      }
    } catch (error) {
      console.error("Error generando rutas:", error);
      return await huggingFaceService.generateOptimalRoutes();
    }
  }

  /**
   * Analiza sentimientos del tráfico
   */
  async analyzeTrafficSentiment(
    reports: Array<{ description: string; area: string }>
  ): Promise<any> {
    try {
      switch (this.currentProvider) {
        case "openai":
          return await openaiService.analyzeTrafficSentiment(reports);
        case "huggingface":
          return await huggingFaceService.analyzeTrafficSentiment();
        default:
          return await huggingFaceService.analyzeTrafficSentiment();
      }
    } catch (error) {
      console.error("Error analizando sentimientos:", error);
      return await huggingFaceService.analyzeTrafficSentiment();
    }
  }

  /**
   * Analiza patrones de tráfico
   */
  async analyzeTrafficPatterns(
    historicalData: WazeAlert[],
    timeRange: string = "1week"
  ): Promise<any> {
    try {
      switch (this.currentProvider) {
        case "openai":
          return await openaiService.analyzeTrafficPatterns(
            historicalData,
            timeRange
          );
        case "huggingface":
          return await huggingFaceService.analyzeTrafficPatterns();
        default:
          return await huggingFaceService.analyzeTrafficPatterns();
      }
    } catch (error) {
      console.error("Error analizando patrones:", error);
      return await huggingFaceService.analyzeTrafficPatterns();
    }
  }

  /**
   * Analiza impacto urbano
   */
  async analyzeUrbanImpact(
    trafficData: WazeAlert[],
    cityInfo: any
  ): Promise<any> {
    try {
      switch (this.currentProvider) {
        case "openai":
          return await openaiService.analyzeUrbanImpact(trafficData, cityInfo);
        case "huggingface":
          return await huggingFaceService.analyzeUrbanImpact();
        default:
          return await huggingFaceService.analyzeUrbanImpact();
      }
    } catch (error) {
      console.error("Error analizando impacto urbano:", error);
      return await huggingFaceService.analyzeUrbanImpact();
    }
  }

  /**
   * Obtiene información sobre el proveedor actual
   */
  getProviderInfo(): { name: string; description: string; available: boolean } {
    switch (this.currentProvider) {
      case "openai":
        return {
          name: "OpenAI GPT",
          description: "Análisis avanzado con ChatGPT",
          available: openaiService.isAIAvailable(),
        };
      case "huggingface":
        return {
          name: "Hugging Face",
          description: "Modelos open source gratuitos",
          available: huggingFaceService.isAIAvailable(),
        };
      default:
        return {
          name: "Análisis Básico",
          description: "Procesamiento sin IA",
          available: true,
        };
    }
  }
}

// Instancia única del servicio unificado
export const aiService = new UnifiedAIService();

// Forzar el uso de Hugging Face al inicializar
if (huggingFaceService.isAIAvailable()) {
  aiService.forceHuggingFace();
  console.log("🤗 Hugging Face configurado como proveedor principal");
}

// Exportar tipos
export type {
  EnhancedOCRResult,
  DocumentType,
  WazeAlert,
  WazeJam,
  WazeAnalysis,
};
