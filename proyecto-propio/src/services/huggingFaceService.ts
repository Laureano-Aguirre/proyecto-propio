import { HfInference } from "@huggingface/inference";

// Configuración de Hugging Face (API Key gratuita)
const HF_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN;

// Crear instancia de Hugging Face
const hf = HF_TOKEN ? new HfInference(HF_TOKEN) : null;

console.log("🤗 Hugging Face Service:", {
  tokenConfigured: !!HF_TOKEN,
  tokenLength: HF_TOKEN ? HF_TOKEN.length : 0,
  instanceCreated: !!hf,
});

// Interfaces para los tipos de documento
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

export interface EnhancedOCRResult {
  originalText: string;
  correctedText: string;
  documentType: DocumentType;
  extractedData: Record<string, any>;
  summary: string;
  confidence: number;
  timestamp: Date;
}

// Interfaces para análisis de Waze
export interface WazeAlert {
  uuid: string;
  type: "HAZARD" | "ROAD_CLOSED" | "ACCIDENT" | "JAM";
  subtype: string;
  street: string;
  city: string;
  country: string;
  location: { x: number; y: number };
  confidence: number;
  reliability: number;
  reportRating: number;
  pubMillis: number;
  reportDescription?: string;
}

export interface WazeJam {
  uuid: string;
  street: string;
  city: string;
  level: number;
  speedKMH: number;
  length: number;
  delay: number;
  line: Array<{ x: number; y: number }>;
  cause?: string;
  recommendedAction?: string;
}

export interface WazeAnalysis {
  trafficPrediction: {
    severity: "low" | "medium" | "high" | "critical";
    peakHours: string[];
    recommendations: string[];
    affectedAreas: string[];
  };
  incidentAnalysis: {
    mostCommonIncidents: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    highRiskAreas: Array<{
      area: string;
      riskLevel: number;
      reasons: string[];
    }>;
    patterns: string[];
  };
  routeOptimization: {
    alternativeRoutes: Array<{ from: string; to: string; suggestion: string }>;
    avoidAreas: string[];
    timeRecommendations: string[];
  };
  cityInsights: {
    overallTrafficHealth: number;
    problemAreas: string[];
    improvements: string[];
    trends: string[];
  };
}

export class HuggingFaceService {
  private checkToken(): boolean {
    if (!hf) {
      console.warn(
        "🤗 Hugging Face token no configurado o sin permisos. Usando análisis básico."
      );
      return false;
    }
    return true;
  }

  /**
   * Ejecuta una petición con reintentos automáticos
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 2000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("429") || error.message.includes("rate"))
        ) {
          if (attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(
              `Límite de Hugging Face alcanzado. Reintentando en ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
    throw new Error("Máximo número de reintentos alcanzado");
  }

  /**
   * Verifica si la IA está disponible
   */
  isAIAvailable(): boolean {
    const hasToken = !!hf;
    console.log(`🤗 Hugging Face disponible: ${hasToken}`);
    return hasToken;
  }

  /**
   * Verifica si los modelos de inferencia están disponibles
   */
  async isInferenceAvailable(): Promise<boolean> {
    if (!this.checkToken()) return false;

    try {
      // Prueba con un modelo que sabemos que funciona
      await this.executeWithRetry(async () => {
        return await hf!.summarization({
          model: "facebook/bart-large-cnn",
          inputs: "test text",
          parameters: {
            max_length: 50,
            min_length: 10,
          },
        });
      });
      return true;
    } catch (error) {
      console.warn("Inferencia no disponible:", error);
      return false;
    }
  }

  /**
   * Prueba la conexión con Hugging Face
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.checkToken()) {
      return {
        success: false,
        message:
          "Token de Hugging Face no configurado. Usando análisis básico.",
      };
    }

    try {
      // Probar primero con sentence-transformers que es más estable
      await this.executeWithRetry(async () => {
        return await hf!.featureExtraction({
          model: "sentence-transformers/all-MiniLM-L6-v2",
          inputs: "Hello world",
        });
      });

      return {
        success: true,
        message: `✅ Conexión exitosa con Hugging Face: Modelo de embeddings funcionando correctamente`,
      };
    } catch (error) {
      console.error("Error probando conexión HF:", error);

      // Intentar con summarization
      try {
        const fallbackResult = await this.executeWithRetry(async () => {
          return await hf!.summarization({
            model: "facebook/bart-large-cnn",
            inputs:
              "This is a test text to verify connection with Hugging Face API.",
            parameters: {
              max_length: 50,
              min_length: 10,
            },
          });
        });

        return {
          success: true,
          message: `✅ Conexión exitosa con Hugging Face: ${
            fallbackResult.summary_text?.slice(0, 50) || "Summarization OK"
          }`,
        };
      } catch (fallbackError) {
        console.error("Error en fallback:", fallbackError);

        // Verificar si es un error de permisos
        if (error instanceof Error && error.message.includes("permissions")) {
          return {
            success: false,
            message:
              "❌ Token sin permisos suficientes. Crear nuevo token con permisos 'Write' e 'Inference API'. Usando análisis básico.",
          };
        }

        return {
          success: false,
          message: `❌ Error de conexión: ${
            error instanceof Error ? error.message : "Error desconocido"
          }. Usando análisis básico.`,
        };
      }
    }
  }

  /**
   * Corrige errores típicos de OCR usando Hugging Face
   */
  async correctOCRErrors(
    text: string,
    _language: string = "es"
  ): Promise<string> {
    if (!this.checkToken()) {
      console.log("🔄 Usando corrección básica de OCR");
      return this.getBasicOCRCorrection(text);
    }

    // Por ahora, siempre usar corrección básica ya que es más estable
    console.log("🔄 Usando corrección básica de OCR (más estable)");
    return this.getBasicOCRCorrection(text);
  }

  /**
   * Corrección básica de OCR sin IA
   */
  private getBasicOCRCorrection(text: string): string {
    return text
      .replace(/\s+/g, " ") // Espacios múltiples
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Separar palabras pegadas
      .replace(/(\d)([A-Z])/g, "$1 $2") // Separar números de letras
      .replace(/([a-z])(\d)/g, "$1 $2") // Separar letras de números
      .replace(/\s+([.,!?])/g, "$1") // Espacios antes de puntuación
      .trim();
  }

  /**
   * Clasifica el tipo de documento usando análisis de texto
   */
  async classifyDocument(text: string): Promise<DocumentType> {
    if (!this.checkToken()) {
      console.log("🔄 Usando clasificación básica de documentos");
      return this.getBasicDocumentClassification(text);
    }

    try {
      const response = await this.executeWithRetry(async () => {
        return await hf!.zeroShotClassification({
          model: "facebook/bart-large-mnli",
          inputs: text.substring(0, 500), // Limitar texto
          parameters: {
            candidate_labels: [
              "invoice",
              "recipe",
              "handwritten note",
              "business card",
              "book page",
              "notes",
              "document",
              "other",
            ],
          },
        });
      });

      // Corregir acceso a propiedades del response
      const bestMatch = (response as any).labels?.[0] || "other";
      const confidence = (response as any).scores?.[0] || 0.5;

      let documentType: DocumentType["type"] = "other";
      if (bestMatch.includes("invoice")) documentType = "invoice";
      else if (bestMatch.includes("recipe")) documentType = "recipe";
      else if (bestMatch.includes("handwritten")) documentType = "handwritten";
      else if (bestMatch.includes("business")) documentType = "business-card";
      else if (bestMatch.includes("book")) documentType = "book";
      else if (bestMatch.includes("notes")) documentType = "notes";

      return {
        type: documentType,
        confidence: confidence,
        description: `${bestMatch} (${Math.round(
          confidence * 100
        )}% confianza IA)`,
      };
    } catch (error) {
      console.error("Error clasificando documento con HF:", error);
      console.log("🔄 Usando clasificación básica de documentos");
      return this.getBasicDocumentClassification(text);
    }
  }

  /**
   * Clasificación básica sin IA - versión mejorada
   */
  private getBasicDocumentClassification(text: string): DocumentType {
    const lowerText = text.toLowerCase();

    // Palabras clave para facturas
    const invoiceKeywords = [
      "total",
      "subtotal",
      "factura",
      "invoice",
      "bill",
      "$",
      "€",
      "precio",
      "amount",
      "tax",
      "iva",
    ];
    const invoiceCount = invoiceKeywords.filter((keyword) =>
      lowerText.includes(keyword)
    ).length;

    // Palabras clave para recetas
    const recipeKeywords = [
      "ingredientes",
      "receta",
      "recipe",
      "preparación",
      "cocinar",
      "hornear",
      "minutos",
      "taza",
      "cucharada",
    ];
    const recipeCount = recipeKeywords.filter((keyword) =>
      lowerText.includes(keyword)
    ).length;

    // Palabras clave para tarjetas de negocio
    const businessKeywords = [
      "@",
      "tel",
      "phone",
      "email",
      "www",
      "director",
      "manager",
      "company",
      "empresa",
    ];
    const businessCount = businessKeywords.filter((keyword) =>
      lowerText.includes(keyword)
    ).length;

    // Palabras clave para notas manuscritas
    const handwrittenKeywords = [
      "nota",
      "recordar",
      "memo",
      "apuntes",
      "escribir",
      "manual",
    ];
    const handwrittenCount = handwrittenKeywords.filter((keyword) =>
      lowerText.includes(keyword)
    ).length;

    // Determinar el tipo con mayor puntuación
    const scores = [
      {
        type: "invoice" as const,
        count: invoiceCount,
        description: "Factura detectada",
      },
      {
        type: "recipe" as const,
        count: recipeCount,
        description: "Receta detectada",
      },
      {
        type: "business-card" as const,
        count: businessCount,
        description: "Tarjeta de negocio detectada",
      },
      {
        type: "handwritten" as const,
        count: handwrittenCount,
        description: "Nota manuscrita detectada",
      },
    ];

    const bestMatch = scores.reduce((best, current) =>
      current.count > best.count ? current : best
    );

    if (bestMatch.count > 0) {
      return {
        type: bestMatch.type,
        confidence: Math.min(0.9, 0.5 + bestMatch.count * 0.1),
        description: `${bestMatch.description} (${bestMatch.count} coincidencias)`,
      };
    }

    return {
      type: "other",
      confidence: 0.5,
      description: "Documento general (análisis básico)",
    };
  }

  /**
   * Extrae datos estructurados usando análisis de texto
   */
  async extractStructuredData(
    text: string,
    documentType: string
  ): Promise<Record<string, any>> {
    if (!this.checkToken()) {
      return this.getBasicStructuredData(text, documentType);
    }

    try {
      // Usar solo análisis básico mejorado por ahora
      console.log("🔄 Usando extracción básica de datos estructurados");
      return this.getBasicStructuredData(text, documentType);
    } catch (error) {
      console.error("Error extrayendo datos con HF:", error);
      return this.getBasicStructuredData(text, documentType);
    }
  }

  /**
   * Extracción básica sin IA - versión mejorada
   */
  private getBasicStructuredData(
    text: string,
    documentType: string
  ): Record<string, any> {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const priceRegex =
      /\$\d+\.?\d*|€\d+\.?\d*|\d+\.?\d*\s*USD|\d+\.?\d*\s*EUR/g;
    const dateRegex =
      /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|\d{2,4}-\d{1,2}-\d{1,2}/g;
    const timeRegex = /\d{1,2}:\d{2}(?:\s*[AP]M)?/gi;

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];
    const prices = text.match(priceRegex) || [];
    const dates = text.match(dateRegex) || [];
    const times = text.match(timeRegex) || [];

    const baseData = {
      content: text,
      emails: emails,
      phones: phones,
      prices: prices,
      dates: dates,
      times: times,
      wordCount: text.split(" ").length,
      characterCount: text.length,
      extractedAt: new Date().toISOString(),
    };

    switch (documentType) {
      case "business-card":
        return {
          ...baseData,
          email: emails[0] || "",
          phone: phones[0] || "",
          extractedEmails: emails,
          extractedPhones: phones,
          type: "business-card",
        };
      case "invoice":
        return {
          ...baseData,
          prices: prices,
          total: prices[prices.length - 1] || "",
          extractedPrices: prices,
          invoiceDate: dates[0] || "",
          type: "invoice",
        };
      case "recipe":
        // Buscar ingredientes y pasos básicos
        const lines = text.split("\n").filter((line) => line.trim().length > 0);
        const ingredients = lines.filter(
          (line) =>
            line.toLowerCase().includes("taza") ||
            line.toLowerCase().includes("cucharada") ||
            line.toLowerCase().includes("gramos") ||
            line.toLowerCase().includes("ml")
        );
        return {
          ...baseData,
          possibleIngredients: ingredients,
          cookingTimes: times,
          type: "recipe",
        };
      default:
        return {
          ...baseData,
          type: "document",
        };
    }
  }

  /**
   * Genera un resumen usando análisis de texto
   */
  async generateSummary(
    text: string,
    maxLength: number = 100
  ): Promise<string> {
    if (!this.checkToken()) {
      return this.getBasicSummary(text, maxLength);
    }

    try {
      // Intentar usar summarization con BART
      const response = await this.executeWithRetry(async () => {
        return await hf!.summarization({
          model: "facebook/bart-large-cnn",
          inputs: text.substring(0, 1000), // Limitar texto para evitar errores
          parameters: {
            max_length: Math.min(maxLength, 150),
            min_length: 20,
          },
        });
      });

      return response.summary_text || this.getBasicSummary(text, maxLength);
    } catch (error) {
      console.error("Error generando resumen con HF:", error);
      console.log("🔄 Usando resumen básico");
      return this.getBasicSummary(text, maxLength);
    }
  }

  /**
   * Genera un resumen básico sin IA
   */
  private getBasicSummary(text: string, maxLength: number): string {
    const words = text.split(" ");
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    if (words.length <= maxLength / 5) {
      return text;
    }

    // Tomar las primeras oraciones hasta llegar al límite
    let summary = "";
    for (const sentence of sentences) {
      if ((summary + sentence).length <= maxLength) {
        summary += sentence + ". ";
      } else {
        break;
      }
    }

    return summary.trim() || `${words.slice(0, maxLength / 5).join(" ")}...`;
  }

  /**
   * Mejora completa del resultado OCR
   */
  async enhanceOCRResult(
    text: string,
    language: string = "es"
  ): Promise<EnhancedOCRResult> {
    try {
      const [correctedText, documentType, summary] = await Promise.all([
        this.correctOCRErrors(text, language),
        this.classifyDocument(text),
        this.generateSummary(text),
      ]);

      const extractedData = await this.extractStructuredData(
        correctedText,
        documentType.type
      );

      return {
        originalText: text,
        correctedText: correctedText,
        documentType: documentType,
        extractedData: extractedData,
        summary: summary,
        confidence: documentType.confidence,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error mejorando resultado OCR:", error);
      return {
        originalText: text,
        correctedText: text,
        documentType: {
          type: "other",
          confidence: 0.5,
          description: "Error en procesamiento",
        },
        extractedData: { error: "Error procesando datos" },
        summary: "Error generando resumen",
        confidence: 0.5,
        timestamp: new Date(),
      };
    }
  }

  // ======================================
  // 🚦 ANÁLISIS DE WAZE - FUNCIONES DE IA
  // ======================================

  /**
   * Analiza datos de tráfico usando reglas básicas y procesamiento de texto
   */
  async analyzeTrafficData(wazeData: {
    alerts: WazeAlert[];
    jams: WazeJam[];
  }): Promise<WazeAnalysis> {
    // Análisis básico sin IA más sofisticado
    const alerts = wazeData.alerts;
    const jams = wazeData.jams;

    const hazards = alerts.filter((a) => a.type === "HAZARD").length;
    const accidents = alerts.filter((a) => a.type === "ACCIDENT").length;
    const closures = alerts.filter((a) => a.type === "ROAD_CLOSED").length;

    const totalIssues = alerts.length + jams.length;
    let severity: "low" | "medium" | "high" | "critical" = "low";

    if (totalIssues > 50) severity = "critical";
    else if (totalIssues > 30) severity = "high";
    else if (totalIssues > 15) severity = "medium";

    // Análisis de areas más afectadas
    const streetCounts = new Map<string, number>();
    [...alerts, ...jams].forEach((item) => {
      const key = `${item.street}, ${item.city}`;
      streetCounts.set(key, (streetCounts.get(key) || 0) + 1);
    });

    const sortedStreets = Array.from(streetCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const problemAreas = sortedStreets.map(([street]) => street);

    return {
      trafficPrediction: {
        severity,
        peakHours: ["07:00-09:00", "17:00-19:00", "21:00-22:00"],
        recommendations: [
          `Se detectaron ${totalIssues} problemas de tráfico`,
          `${accidents} accidentes activos`,
          `${hazards} peligros reportados`,
          "Evita las áreas más congestionadas",
          "Planifica rutas alternativas",
        ],
        affectedAreas: problemAreas,
      },
      incidentAnalysis: {
        mostCommonIncidents: [
          {
            type: "HAZARD",
            count: hazards,
            percentage: Math.round((hazards / alerts.length) * 100) || 0,
          },
          {
            type: "ACCIDENT",
            count: accidents,
            percentage: Math.round((accidents / alerts.length) * 100) || 0,
          },
          {
            type: "ROAD_CLOSED",
            count: closures,
            percentage: Math.round((closures / alerts.length) * 100) || 0,
          },
        ],
        highRiskAreas: sortedStreets.slice(0, 3).map(([area, count]) => ({
          area,
          riskLevel: Math.min(10, count * 2),
          reasons: [`${count} incidentes reportados`],
        })),
        patterns: [
          `${alerts.length} alertas activas`,
          `${jams.length} congestiones reportadas`,
          `Área más afectada: ${sortedStreets[0]?.[0] || "No detectada"}`,
        ],
      },
      routeOptimization: {
        alternativeRoutes: [
          {
            from: "Centro",
            to: "Zona Norte",
            suggestion: "Evitar autopistas principales",
          },
          {
            from: "Zona Oeste",
            to: "Zona Este",
            suggestion: "Usar calles secundarias",
          },
        ],
        avoidAreas: problemAreas.slice(0, 3),
        timeRecommendations: [
          "Evita viajar entre 7-9 AM y 5-7 PM",
          "Mejor horario: 10 AM - 4 PM",
          "Fines de semana: menos congestión",
        ],
      },
      cityInsights: {
        overallTrafficHealth: Math.max(0, 100 - totalIssues * 2),
        problemAreas: problemAreas,
        improvements: [
          "Implementar semáforos inteligentes",
          "Mejorar señalización en zonas críticas",
          "Fomentar transporte público",
        ],
        trends: [
          `Nivel de actividad: ${severity}`,
          `${totalIssues} eventos activos`,
          "Análisis en tiempo real activo",
        ],
      },
    };
  }

  /**
   * Fallback para funciones que requieren IA más avanzada
   */
  async predictTrafficProblems(): Promise<any> {
    return {
      predictions: [
        {
          time: "Próximas 2 horas",
          area: "Zonas céntricas",
          type: "CONGESTION",
          probability: 0.7,
          severity: "medium",
        },
      ],
      recommendations: [
        "Funcionalidad básica activa",
        "Configura token HF para predicciones avanzadas",
        "Monitoreo manual recomendado",
      ],
    };
  }

  async generateOptimalRoutes(): Promise<any> {
    return {
      routes: [
        {
          name: "Ruta Estándar",
          estimatedTime: "Tiempo variable",
          difficulty: "medium",
          advantages: ["Análisis básico disponible"],
          warnings: ["Configura token HF para análisis avanzado"],
        },
      ],
      bestTime: "Evita horas pico",
      trafficTips: ["Monitorea tráfico manualmente", "Usa apps de navegación"],
    };
  }

  async analyzeTrafficSentiment(): Promise<any> {
    return {
      overallMood: "neutral" as const,
      frustrationLevel: 5,
      commonComplaints: ["Análisis básico disponible"],
      satisfactionAreas: [],
      recommendations: ["Configura token HF para análisis de sentimientos"],
    };
  }

  async analyzeTrafficPatterns(): Promise<any> {
    return {
      peakHours: [
        { hour: "08:00", intensity: 8 },
        { hour: "17:00", intensity: 9 },
        { hour: "21:00", intensity: 6 },
      ],
      weeklyPatterns: [
        { day: "lunes", severity: "high" },
        { day: "viernes", severity: "high" },
        { day: "sábado", severity: "medium" },
      ],
      seasonalTrends: ["Análisis básico disponible"],
      anomalies: [],
      insights: ["Configura token HF para análisis de patrones avanzado"],
    };
  }

  async analyzeUrbanImpact(): Promise<any> {
    return {
      economicImpact: {
        lostProductivity: "Análisis básico disponible",
        fuelWaste: "Configura token HF",
        healthCosts: "Para análisis avanzado",
      },
      environmentalImpact: {
        emissions: "Datos básicos disponibles",
        pollutionLevel: "Medio",
        recommendations: ["Configura token HF para análisis ambiental"],
      },
      socialImpact: {
        stressLevel: "Medio",
        qualityOfLife: "Análisis básico",
        affectedPopulation: "Datos limitados",
      },
      solutions: [
        "Análisis básico disponible",
        "Configura token HF para insights avanzados",
      ],
    };
  }
}

export const huggingFaceService = new HuggingFaceService();
