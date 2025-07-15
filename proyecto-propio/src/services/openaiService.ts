import OpenAI from "openai";

// Configuración de OpenAI - DESHABILITADO (usar Hugging Face)
const API_KEY = undefined; // import.meta.env.VITE_OPENAI_API_KEY;
const openai = API_KEY
  ? new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true, // Para desarrollo, en producción usar backend
    })
  : null;

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

// Nuevas interfaces para análisis de Waze
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
  level: number; // 1-5
  speedKMH: number;
  length: number;
  delay: number;
  line: Array<{ x: number; y: number }>;

  // Nuevas propiedades para análisis avanzado
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

    // Nuevas métricas de riesgo
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
    overallTrafficHealth: number; // 0-100
    problemAreas: string[];
    improvements: string[];
    trends: string[];
  };
}

export class OpenAIService {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 segundo entre peticiones

  private checkApiKey(): boolean {
    if (!openai) {
      console.warn(
        "OpenAI API Key no configurada. Funcionalidades de IA deshabilitadas."
      );
      return false;
    }
    return true;
  }

  /**
   * Procesa la cola de peticiones con límite de velocidad
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
        );
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          this.lastRequestTime = Date.now();
          await request();
        } catch (error) {
          console.error("Error procesando petición:", error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Ejecuta una petición con reintentos automáticos
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (error instanceof Error && error.message.includes("429")) {
          if (attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt); // Espera exponencial
            console.log(`Límite alcanzado. Reintentando en ${delay}ms...`);
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
    return !!openai;
  }

  /**
   * Prueba la conexión con OpenAI
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.checkApiKey()) {
      return {
        success: false,
        message: "API Key no configurada",
      };
    }

    try {
      const result = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: "Responde solo con 'OK' si me puedes entender.",
            },
          ],
          max_tokens: 5,
          temperature: 0,
        });
      });

      const content = result.choices[0]?.message?.content || "";
      return {
        success: true,
        message: `Conexión exitosa: ${content}`,
      };
    } catch (error) {
      console.error("Error probando conexión:", error);

      if (error instanceof Error) {
        if (error.message.includes("401")) {
          return {
            success: false,
            message: "API Key inválida - verifica tu clave",
          };
        }
        if (error.message.includes("429")) {
          return {
            success: false,
            message:
              "Límite de uso excedido - reintentado automáticamente pero sigue fallando. Espera unos minutos.",
          };
        }
        if (error.message.includes("insufficient_quota")) {
          return {
            success: false,
            message: "Cuota de API agotada - verifica tu cuenta OpenAI",
          };
        }

        return {
          success: false,
          message: `Error: ${error.message}`,
        };
      }

      return {
        success: false,
        message: "Error desconocido",
      };
    }
  }

  /**
   * Corrige errores típicos de OCR usando ChatGPT
   */
  async correctOCRErrors(
    text: string,
    language: string = "es"
  ): Promise<string> {
    if (!this.checkApiKey()) return text;

    try {
      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Eres un experto en corrección de texto extraído por OCR. Tu trabajo es:
              1. Corregir errores típicos de OCR (0 por O, 1 por I, etc.)
              2. Mantener el formato original del texto
              3. Corregir ortografía y gramática
              4. Responder SOLO con el texto corregido, sin explicaciones adicionales
              
              Idioma principal: ${language === "spa" ? "español" : "inglés"}`,
            },
            {
              role: "user",
              content: `Corrige este texto extraído por OCR: "${text}"`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        });
      });

      return response.choices[0]?.message?.content || text;
    } catch (error) {
      console.error("Error corrigiendo texto OCR:", error);
      return text; // Retorna el texto original si hay error
    }
  }

  /**
   * Clasifica el tipo de documento basado en el contenido
   */
  async classifyDocument(text: string): Promise<DocumentType> {
    if (!this.checkApiKey()) {
      return {
        type: "other",
        confidence: 0.8,
        description: "Documento de texto general (IA no disponible)",
      };
    }

    try {
      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Analiza el texto y clasifica el tipo de documento. Responde SOLO con un JSON válido:
              {
                "type": "invoice|recipe|handwritten|business-card|book|notes|other",
                "confidence": 0.0-1.0,
                "description": "descripción breve del documento"
              }`,
            },
            {
              role: "user",
              content: `Clasifica este documento: "${text}"`,
            },
          ],
          temperature: 0.2,
          max_tokens: 200,
        });
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      return {
        type: result.type || "other",
        confidence: result.confidence || 0.5,
        description: result.description || "Documento no clasificado",
      };
    } catch (error) {
      console.error("Error clasificando documento:", error);

      // Manejo específico de errores de OpenAI
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          return {
            type: "other",
            confidence: 0.5,
            description: "Error de autenticación - API Key inválida",
          };
        }
        if (error.message.includes("429")) {
          return {
            type: "other",
            confidence: 0.5,
            description:
              "Límite de uso excedido - procesamiento con reintentos automáticos falló",
          };
        }
        if (error.message.includes("network")) {
          return {
            type: "other",
            confidence: 0.5,
            description: "Error de conexión - verifica tu internet",
          };
        }
      }

      return {
        type: "other",
        confidence: 0.5,
        description: `Error en clasificación: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Extrae datos estructurados según el tipo de documento
   */
  async extractStructuredData(
    text: string,
    documentType: string
  ): Promise<Record<string, any>> {
    if (!this.checkApiKey()) {
      return {
        content: text,
        note: "Funcionalidad de IA no disponible. Configura VITE_OPENAI_API_KEY para activar extracción automática de datos.",
        rawText: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
      };
    }

    const prompts = {
      invoice: `Extrae datos de factura en JSON: {"company": "", "total": "", "date": "", "items": []}`,
      recipe: `Extrae datos de receta en JSON: {"title": "", "ingredients": [], "steps": [], "servings": ""}`,
      "business-card": `Extrae datos de tarjeta en JSON: {"name": "", "company": "", "phone": "", "email": ""}`,
      handwritten: `Extrae información clave en JSON: {"topic": "", "keyPoints": [], "dates": []}`,
      book: `Extrae datos de libro en JSON: {"title": "", "author": "", "chapter": "", "keyIdeas": []}`,
      notes: `Extrae información de notas en JSON: {"topic": "", "mainPoints": [], "actionItems": []}`,
    };

    try {
      const prompt =
        prompts[documentType as keyof typeof prompts] ||
        `Extrae información relevante en JSON: {"content": "", "keyPoints": []}`;

      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Eres un experto en extracción de datos. ${prompt}. Responde SOLO con JSON válido.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.2,
          max_tokens: 500,
        });
      });

      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error extrayendo datos:", error);

      if (error instanceof Error && error.message.includes("429")) {
        return {
          content: text,
          note: "Límite de uso de API excedido. Reintentos automáticos fallaron. Los datos se mostrarán como texto plano.",
          rawText: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
        };
      }

      return {
        error: "Error extrayendo datos estructurados",
        content: text,
        rawText: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
      };
    }
  }

  /**
   * Genera un resumen del documento
   */
  async generateSummary(
    text: string,
    maxLength: number = 100
  ): Promise<string> {
    if (!this.checkApiKey()) {
      const preview = text.substring(0, maxLength);
      return `${preview}${
        text.length > maxLength ? "..." : ""
      } (Resumen automático no disponible - configura API Key para resúmenes inteligentes)`;
    }

    try {
      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Crea un resumen conciso del texto en máximo ${maxLength} caracteres. Sé directo y preciso.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        });
      });

      return response.choices[0]?.message?.content || "Resumen no disponible";
    } catch (error) {
      console.error("Error generando resumen:", error);

      // Manejo específico de errores
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          return "Error de autenticación - API Key inválida";
        }
        if (error.message.includes("429")) {
          return "Límite de uso excedido - reintentos automáticos fallaron. Espera unos minutos.";
        }
        if (error.message.includes("network")) {
          return "Error de conexión - verifica tu internet";
        }
        if (error.message.includes("insufficient_quota")) {
          return "Cuota de API agotada - verifica tu cuenta OpenAI";
        }

        return `Error: ${error.message}`;
      }

      return "Error generando resumen";
    }
  }

  /**
   * Mejora el resultado OCR con análisis de IA
   */
  async enhanceOCRResult(
    text: string,
    language: string = "spa"
  ): Promise<{
    originalText: string;
    correctedText: string;
    documentType: DocumentType;
    extractedData: Record<string, any>;
    summary: string;
    confidence: number;
  }> {
    if (!this.checkApiKey()) {
      return {
        originalText: text,
        correctedText: text,
        documentType: {
          type: "other",
          confidence: 0.8,
          description: "Documento de texto general (IA no disponible)",
        },
        extractedData: {
          content: text,
          note: "Funcionalidad de IA no disponible. Configura VITE_OPENAI_API_KEY para activar mejoras automáticas.",
        },
        summary: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        confidence: 0.5,
      };
    }

    try {
      // Procesar en paralelo todas las mejoras
      const [correctedText, documentType, summary] = await Promise.all([
        this.correctOCRErrors(text, language),
        this.classifyDocument(text),
        this.generateSummary(text),
      ]);

      // Extraer datos con la clasificación correcta
      const finalExtractedData = await this.extractStructuredData(
        correctedText,
        documentType.type
      );

      return {
        originalText: text,
        correctedText,
        documentType,
        extractedData: finalExtractedData,
        summary,
        confidence: Math.max(0.7, documentType.confidence),
      };
    } catch (error) {
      console.error("Error mejorando resultado OCR:", error);

      // Retornar resultado básico en caso de error
      return {
        originalText: text,
        correctedText: text,
        documentType: {
          type: "other",
          confidence: 0.5,
          description: "Error en procesamiento IA",
        },
        extractedData: {
          content: text,
          error: "Error en mejora automática",
          note: "Los datos se muestran sin procesar debido a un error",
        },
        summary: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        confidence: 0.5,
      };
    }
  }

  // ======================================
  // 🚦 ANÁLISIS DE WAZE - FUNCIONES DE IA
  // ======================================

  /**
   * Analiza datos de tráfico de Waze y genera predicciones inteligentes
   */
  async analyzeTrafficData(wazeData: {
    alerts: WazeAlert[];
    jams: WazeJam[];
  }): Promise<WazeAnalysis> {
    if (!this.checkApiKey()) {
      return this.getFallbackWazeAnalysis(wazeData);
    }

    try {
      const dataString = JSON.stringify(wazeData, null, 2);

      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Eres un experto analista de tráfico urbano. Analiza los datos de Waze y genera insights inteligentes.

              Responde SOLO con un JSON válido con esta estructura:
              {
                "trafficPrediction": {
                  "severity": "low|medium|high|critical",
                  "peakHours": ["hora1", "hora2"],
                  "recommendations": ["recomendación1", "recomendación2"],
                  "affectedAreas": ["zona1", "zona2"]
                },
                "incidentAnalysis": {
                  "mostCommonIncidents": [{"type": "tipo", "count": 0, "percentage": 0}],
                  "highRiskAreas": [{"area": "zona", "riskLevel": 0, "reasons": ["razón1"]}],
                  "patterns": ["patrón1", "patrón2"]
                },
                "routeOptimization": {
                  "alternativeRoutes": [{"from": "origen", "to": "destino", "suggestion": "sugerencia"}],
                  "avoidAreas": ["área1", "área2"],
                  "timeRecommendations": ["recomendación1"]
                },
                "cityInsights": {
                  "overallTrafficHealth": 85,
                  "problemAreas": ["área1", "área2"],
                  "improvements": ["mejora1", "mejora2"],
                  "trends": ["tendencia1", "tendencia2"]
                }
              }`,
            },
            {
              role: "user",
              content: `Analiza estos datos de tráfico de Waze para Buenos Aires: ${dataString}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        });
      });

      const analysis = JSON.parse(
        response.choices[0]?.message?.content || "{}"
      );
      return analysis;
    } catch (error) {
      console.error("Error analizando datos de tráfico:", error);
      return this.getFallbackWazeAnalysis(wazeData);
    }
  }

  /**
   * Predice problemas de tráfico futuros usando IA
   */
  async predictTrafficProblems(
    historicalData: WazeAlert[],
    timeFrame: string = "24h"
  ): Promise<{
    predictions: Array<{
      time: string;
      area: string;
      type: string;
      probability: number;
      severity: string;
    }>;
    recommendations: string[];
  }> {
    if (!this.checkApiKey()) {
      return {
        predictions: [],
        recommendations: [
          "Configura API Key para predicciones de tráfico avanzadas",
          "Monitorea manualmente las áreas con mayor frecuencia de incidentes",
        ],
      };
    }

    try {
      const dataString = JSON.stringify(historicalData.slice(-50), null, 2);

      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Eres un sistema de predicción de tráfico que usa machine learning.
              Analiza patrones históricos y predice futuros problemas de tráfico.
              
              Responde SOLO con JSON válido:
              {
                "predictions": [
                  {
                    "time": "2025-07-14 08:00",
                    "area": "Av. Corrientes",
                    "type": "CONGESTION",
                    "probability": 0.85,
                    "severity": "high"
                  }
                ],
                "recommendations": ["recomendación1", "recomendación2"]
              }`,
            },
            {
              role: "user",
              content: `Predice problemas de tráfico para las próximas ${timeFrame} basándote en: ${dataString}`,
            },
          ],
          temperature: 0.4,
          max_tokens: 1000,
        });
      });

      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error prediciendo tráfico:", error);
      return {
        predictions: [],
        recommendations: ["Error en predicción - revisa datos históricos"],
      };
    }
  }

  /**
   * Genera recomendaciones de rutas optimizadas
   */
  async generateOptimalRoutes(
    from: string,
    to: string,
    currentTraffic: WazeAlert[]
  ): Promise<{
    routes: Array<{
      name: string;
      estimatedTime: string;
      difficulty: string;
      advantages: string[];
      warnings: string[];
    }>;
    bestTime: string;
    trafficTips: string[];
  }> {
    if (!this.checkApiKey()) {
      return {
        routes: [
          {
            name: "Ruta principal",
            estimatedTime: "Tiempo estimado no disponible",
            difficulty: "medium",
            advantages: ["Ruta más directa"],
            warnings: ["Verifica tráfico manualmente"],
          },
        ],
        bestTime: "Evita horas pico: 7-9 AM y 5-7 PM",
        trafficTips: ["Configura API Key para optimización de rutas avanzada"],
      };
    }

    try {
      const trafficData = JSON.stringify(currentTraffic.slice(-30), null, 2);

      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Eres un experto en optimización de rutas urbanas.
              Analiza el tráfico actual y sugiere las mejores rutas.
              
              Responde SOLO con JSON válido:
              {
                "routes": [
                  {
                    "name": "Ruta Norte",
                    "estimatedTime": "25 minutos",
                    "difficulty": "easy",
                    "advantages": ["Menos semáforos", "Mejor pavimento"],
                    "warnings": ["Construcción en la cuadra 800"]
                  }
                ],
                "bestTime": "Mejor momento para viajar",
                "trafficTips": ["consejo1", "consejo2"]
              }`,
            },
            {
              role: "user",
              content: `Optimiza rutas de ${from} a ${to} considerando tráfico actual: ${trafficData}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        });
      });

      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error optimizando rutas:", error);
      return {
        routes: [],
        bestTime: "Error calculando tiempo óptimo",
        trafficTips: ["Error en optimización de rutas"],
      };
    }
  }

  /**
   * Análisis de sentimientos en reportes de tráfico
   */
  async analyzeTrafficSentiment(
    reports: Array<{ description: string; area: string }>
  ): Promise<{
    overallMood: "positive" | "negative" | "neutral";
    frustrationLevel: number; // 0-10
    commonComplaints: string[];
    satisfactionAreas: string[];
    recommendations: string[];
  }> {
    if (!this.checkApiKey()) {
      return {
        overallMood: "neutral",
        frustrationLevel: 5,
        commonComplaints: ["Datos de sentimiento no disponibles"],
        satisfactionAreas: [],
        recommendations: ["Configura API Key para análisis de sentimientos"],
      };
    }

    try {
      const reportsString = JSON.stringify(reports, null, 2);

      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Analiza el sentimiento en reportes de tráfico.
              Identifica frustración, satisfacción y patrones emocionales.
              
              Responde SOLO con JSON válido:
              {
                "overallMood": "positive|negative|neutral",
                "frustrationLevel": 7,
                "commonComplaints": ["queja1", "queja2"],
                "satisfactionAreas": ["área1", "área2"],
                "recommendations": ["recomendación1", "recomendación2"]
              }`,
            },
            {
              role: "user",
              content: `Analiza sentimientos en estos reportes: ${reportsString}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 800,
        });
      });

      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error analizando sentimiento:", error);
      return {
        overallMood: "neutral",
        frustrationLevel: 5,
        commonComplaints: ["Error analizando reportes"],
        satisfactionAreas: [],
        recommendations: ["Revisa manualmente los reportes"],
      };
    }
  }

  /**
   * Análisis de patrones temporales en el tráfico
   */
  async analyzeTrafficPatterns(
    historicalData: WazeAlert[],
    timeRange: string = "1week"
  ): Promise<{
    peakHours: Array<{ hour: string; intensity: number }>;
    weeklyPatterns: Array<{ day: string; severity: string }>;
    seasonalTrends: string[];
    anomalies: Array<{ date: string; type: string; description: string }>;
    insights: string[];
  }> {
    if (!this.checkApiKey()) {
      return {
        peakHours: [],
        weeklyPatterns: [],
        seasonalTrends: ["Análisis no disponible sin API Key"],
        anomalies: [],
        insights: ["Configura API Key para análisis de patrones avanzado"],
      };
    }

    try {
      const dataString = JSON.stringify(historicalData.slice(-100), null, 2);

      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Eres un analista de patrones de tráfico urbano.
              Identifica tendencias temporales, anomalías y patrones estacionales.
              
              Responde SOLO con JSON válido:
              {
                "peakHours": [{"hour": "08:00", "intensity": 9}],
                "weeklyPatterns": [{"day": "lunes", "severity": "high"}],
                "seasonalTrends": ["tendencia1", "tendencia2"],
                "anomalies": [{"date": "2025-07-14", "type": "spike", "description": "Pico inusual"}],
                "insights": ["insight1", "insight2"]
              }`,
            },
            {
              role: "user",
              content: `Analiza patrones temporales en ${timeRange}: ${dataString}`,
            },
          ],
          temperature: 0.4,
          max_tokens: 1200,
        });
      });

      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error analizando patrones:", error);
      return {
        peakHours: [],
        weeklyPatterns: [],
        seasonalTrends: ["Error en análisis de patrones"],
        anomalies: [],
        insights: ["Revisa datos históricos manualmente"],
      };
    }
  }

  /**
   * Análisis de impacto urbano del tráfico
   */
  async analyzeUrbanImpact(
    trafficData: WazeAlert[],
    cityInfo: { population: number; area: string; economicZones: string[] }
  ): Promise<{
    economicImpact: {
      lostProductivity: string;
      fuelWaste: string;
      healthCosts: string;
    };
    environmentalImpact: {
      emissions: string;
      pollutionLevel: string;
      recommendations: string[];
    };
    socialImpact: {
      stressLevel: string;
      qualityOfLife: string;
      affectedPopulation: string;
    };
    solutions: string[];
  }> {
    if (!this.checkApiKey()) {
      return {
        economicImpact: {
          lostProductivity: "Análisis no disponible",
          fuelWaste: "Requiere API Key",
          healthCosts: "Configurar OpenAI",
        },
        environmentalImpact: {
          emissions: "Datos no disponibles",
          pollutionLevel: "Requiere análisis IA",
          recommendations: ["Configura API Key para análisis ambiental"],
        },
        socialImpact: {
          stressLevel: "No disponible",
          qualityOfLife: "Requiere IA",
          affectedPopulation: "Datos no disponibles",
        },
        solutions: ["Configura OpenAI API Key para análisis urbano completo"],
      };
    }

    try {
      const analysisContext = {
        traffic: trafficData.slice(-50),
        city: cityInfo,
      };

      const response = await this.executeWithRetry(async () => {
        return await openai!.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Eres un urbanista especializado en análisis de impacto del tráfico.
              Evalúa efectos económicos, ambientales y sociales del tráfico urbano.
              
              Responde SOLO con JSON válido:
              {
                "economicImpact": {
                  "lostProductivity": "XX horas/día perdidas",
                  "fuelWaste": "XX litros desperdiciados",
                  "healthCosts": "Impacto en salud"
                },
                "environmentalImpact": {
                  "emissions": "XX toneladas CO2",
                  "pollutionLevel": "Alto/Medio/Bajo",
                  "recommendations": ["recomendación1"]
                },
                "socialImpact": {
                  "stressLevel": "Alto/Medio/Bajo",
                  "qualityOfLife": "Impacto en calidad de vida",
                  "affectedPopulation": "XX% población afectada"
                },
                "solutions": ["solución1", "solución2"]
              }`,
            },
            {
              role: "user",
              content: `Analiza impacto urbano: ${JSON.stringify(
                analysisContext
              )}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1200,
        });
      });

      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
      console.error("Error analizando impacto urbano:", error);
      return {
        economicImpact: {
          lostProductivity: "Error en cálculo",
          fuelWaste: "Error en análisis",
          healthCosts: "Error en estimación",
        },
        environmentalImpact: {
          emissions: "Error en cálculo",
          pollutionLevel: "Error en análisis",
          recommendations: ["Revisa datos manualmente"],
        },
        socialImpact: {
          stressLevel: "Error en análisis",
          qualityOfLife: "Error en evaluación",
          affectedPopulation: "Error en cálculo",
        },
        solutions: ["Error en análisis - revisa datos"],
      };
    }
  }

  /**
   * Análisis de fallback cuando no hay API Key
   */
  private getFallbackWazeAnalysis(wazeData: {
    alerts: WazeAlert[];
    jams: WazeJam[];
  }): WazeAnalysis {
    const totalAlerts = wazeData.alerts.length;
    const totalJams = wazeData.jams.length;

    // Análisis básico sin IA
    const hazardCount = wazeData.alerts.filter(
      (a) => a.type === "HAZARD"
    ).length;
    const closureCount = wazeData.alerts.filter(
      (a) => a.type === "ROAD_CLOSED"
    ).length;
    const accidentCount = wazeData.alerts.filter(
      (a) => a.type === "ACCIDENT"
    ).length;

    const severity =
      totalAlerts > 50 ? "high" : totalAlerts > 20 ? "medium" : "low";

    return {
      trafficPrediction: {
        severity,
        peakHours: ["08:00-09:00", "17:00-19:00"],
        recommendations: [
          "Configura API Key para recomendaciones inteligentes",
          "Evita horas pico identificadas",
          `Se detectaron ${totalAlerts} alertas activas`,
        ],
        affectedAreas: ["Análisis detallado requiere API Key"],
      },
      incidentAnalysis: {
        mostCommonIncidents: [
          {
            type: "HAZARD",
            count: hazardCount,
            percentage: Math.round((hazardCount / totalAlerts) * 100),
          },
          {
            type: "ROAD_CLOSED",
            count: closureCount,
            percentage: Math.round((closureCount / totalAlerts) * 100),
          },
          {
            type: "ACCIDENT",
            count: accidentCount,
            percentage: Math.round((accidentCount / totalAlerts) * 100),
          },
        ],
        highRiskAreas: [
          {
            area: "Análisis requiere API Key",
            riskLevel: 5,
            reasons: ["Configurar OpenAI"],
          },
        ],
        patterns: [
          `${totalAlerts} alertas activas detectadas`,
          `${totalJams} congestiones reportadas`,
          "Análisis de patrones requiere API Key",
        ],
      },
      routeOptimization: {
        alternativeRoutes: [
          {
            from: "Origen",
            to: "Destino",
            suggestion: "Configura API Key para rutas optimizadas",
          },
        ],
        avoidAreas: ["Análisis requiere API Key"],
        timeRecommendations: [
          "Evita horas pico",
          "Configura API Key para recomendaciones específicas",
        ],
      },
      cityInsights: {
        overallTrafficHealth: Math.max(0, 100 - totalAlerts * 2),
        problemAreas: ["Análisis detallado requiere API Key"],
        improvements: ["Configura OpenAI API Key para insights inteligentes"],
        trends: [
          `${totalAlerts} alertas activas`,
          "Análisis de tendencias requiere IA",
        ],
      },
    };
  }
}

export const openaiService = new OpenAIService();

export interface EnhancedOCRResult {
  originalText: string;
  correctedText: string;
  documentType: DocumentType;
  extractedData: Record<string, any>;
  summary: string;
  confidence: number;
}
