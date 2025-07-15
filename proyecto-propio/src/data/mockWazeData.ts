import type { WazeAlert, WazeJam } from "../services/aiService";

// Datos de prueba para demostrar la funcionalidad
export const mockWazeData = {
  alerts: [
    {
      uuid: "1",
      type: "ACCIDENT",
      subtype: "ACCIDENT_MAJOR",
      street: "Av. Libertador",
      city: "Buenos Aires",
      country: "AR",
      location: { x: -58.3974, y: -34.5875 },
      confidence: 5,
      reliability: 4,
      reportRating: 3,
      pubMillis: Date.now(),
      reportDescription: "Accidente en Av. Libertador altura 1200",
    },
    {
      uuid: "2",
      type: "ROAD_CLOSED",
      subtype: "ROAD_CLOSED_CONSTRUCTION",
      street: "Av. Corrientes",
      city: "Buenos Aires",
      country: "AR",
      location: { x: -58.3816, y: -34.6037 },
      confidence: 5,
      reliability: 5,
      reportRating: 4,
      pubMillis: Date.now(),
      reportDescription: "Corte de calzada por obras en Av. Corrientes",
    },
    {
      uuid: "3",
      type: "HAZARD",
      subtype: "HAZARD_ON_ROAD_OBJECT",
      street: "Autopista Panamericana",
      city: "Vicente López",
      country: "AR",
      location: { x: -58.486, y: -34.5465 },
      confidence: 3,
      reliability: 3,
      reportRating: 2,
      pubMillis: Date.now(),
      reportDescription: "Objeto en la vía - Autopista Panamericana",
    },
    {
      uuid: "4",
      type: "HAZARD",
      subtype: "HAZARD_ON_ROAD_POLICE",
      street: "Av. 9 de Julio",
      city: "Buenos Aires",
      country: "AR",
      location: { x: -58.396, y: -34.6118 },
      confidence: 4,
      reliability: 4,
      reportRating: 3,
      pubMillis: Date.now(),
      reportDescription: "Control policial en Av. 9 de Julio",
    },
    {
      uuid: "5",
      type: "HAZARD",
      subtype: "HAZARD_WEATHER",
      street: "Av. Santa Fe",
      city: "Buenos Aires",
      country: "AR",
      location: { x: -58.4333, y: -34.6158 },
      confidence: 5,
      reliability: 4,
      reportRating: 4,
      pubMillis: Date.now(),
      reportDescription: "Lluvia intensa afectando visibilidad",
    },
  ] as WazeAlert[],

  jams: [
    {
      uuid: "1",
      street: "Av. Libertador",
      city: "Buenos Aires",
      level: 4,
      speedKMH: 15,
      length: 1200,
      delay: 8,
      line: [
        { x: -58.3974, y: -34.5875 },
        { x: -58.396, y: -34.589 },
      ],
      cause: "Accidente vehicular",
      recommendedAction: "Usar ruta alternativa",
    },
    {
      uuid: "2",
      street: "Av. Corrientes",
      city: "Buenos Aires",
      level: 3,
      speedKMH: 20,
      length: 800,
      delay: 5,
      line: [
        { x: -58.3816, y: -34.6037 },
        { x: -58.38, y: -34.6042 },
      ],
      cause: "Obras en la vía",
      recommendedAction: "Tomar Av. Rivadavia",
    },
    {
      uuid: "3",
      street: "Autopista Panamericana",
      city: "Vicente López",
      level: 5,
      speedKMH: 8,
      length: 2500,
      delay: 15,
      line: [
        { x: -58.486, y: -34.5465 },
        { x: -58.484, y: -34.548 },
      ],
      cause: "Tráfico pesado hora pico",
      recommendedAction: "Considerar transporte público",
    },
    {
      uuid: "4",
      street: "Av. 9 de Julio",
      city: "Buenos Aires",
      level: 2,
      speedKMH: 35,
      length: 600,
      delay: 3,
      line: [
        { x: -58.396, y: -34.6118 },
        { x: -58.3962, y: -34.6125 },
      ],
      cause: "Flujo normal con demoras menores",
      recommendedAction: "Continuar por ruta actual",
    },
  ] as WazeJam[],
};

// URLs de APIs públicas de Waze (estas pueden cambiar)
export const wazeApiUrls = [
  "https://www.waze.com/row-partnerhub-api/partners/11517520851/waze-feeds/f57e2769-8f32-45ca-a6ce-da8207894c1f?format=1",
  "https://www.waze.com/partnerhub-api/partners/11517520851/waze-feeds/f57e2769-8f32-45ca-a6ce-da8207894c1f?format=1",
  "https://www.waze.com/rtserver/web/TGeoRSS?tk=ccp_tk&ccp_ch=CHANNEL_WAZE_WEBSITE&ccp_rel=website&ccp_country=AR&ccp_city=Buenos%20Aires",
];

// Función para obtener datos con fallback
export const getWazeDataWithFallback = async (): Promise<{
  alerts: WazeAlert[];
  jams: WazeJam[];
}> => {
  // Intentar con las URLs reales
  for (const url of wazeApiUrls) {
    try {
      console.log(`🔄 Intentando cargar datos de: ${url}`);
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Datos cargados exitosamente de la API real");

        return {
          alerts: data.alerts || [],
          jams: data.jams || [],
        };
      }
    } catch (error) {
      console.warn(`❌ Error con URL: ${url}`, error);
      continue;
    }
  }

  // Si todas las URLs fallan, usar datos de prueba
  console.log("🔄 APIs no disponibles, usando datos de demostración");
  return mockWazeData;
};
