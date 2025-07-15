import React, { useState, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { getWazeDataWithFallback } from '../data/mockWazeData';
import type { WazeAlert, WazeJam, WazeAnalysis } from '../services/aiService';
import './WazeAnalysis.css';

interface WazeAnalysisProps {
  wazeApiUrl?: string;
}

const WazeAnalysisComponent: React.FC<WazeAnalysisProps> = ({ wazeApiUrl }) => {
  const [wazeData, setWazeData] = useState<{ alerts: WazeAlert[]; jams: WazeJam[] } | null>(null);
  const [analysis, setAnalysis] = useState<WazeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'demo'>('demo');
  const [activeTab, setActiveTab] = useState<'traffic' | 'incidents' | 'routes' | 'insights'>('traffic');

  // Cargar datos de Waze con fallback
  const loadWazeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Intentar con API real primero si se proporciona URL
      if (wazeApiUrl) {
        try {
          console.log(`🔄 Intentando cargar datos de API: ${wazeApiUrl}`);
          const response = await fetch(wazeApiUrl);
          
          if (response.ok) {
            const data = await response.json();
            const formattedData = {
              alerts: data.alerts || [],
              jams: data.jams || []
            };
            
            setWazeData(formattedData);
            setDataSource('api');
            console.log('✅ Datos cargados desde API real');
          } else {
            throw new Error(`API responded with status: ${response.status}`);
          }
        } catch (apiError) {
          console.warn('❌ Error con API real, usando datos de demostración:', apiError);
          // Usar datos de fallback
          const fallbackData = await getWazeDataWithFallback();
          setWazeData(fallbackData);
          setDataSource('demo');
        }
      } else {
        // Usar datos de demostración directamente
        const fallbackData = await getWazeDataWithFallback();
        setWazeData(fallbackData);
        setDataSource('demo');
      }
      
      // Analizar con IA si hay datos
      if (wazeData || true) { // Siempre analizar porque tenemos datos de fallback
        const dataToAnalyze = wazeData || await getWazeDataWithFallback();
        const aiAnalysis = await aiService.analyzeTrafficData(dataToAnalyze);
        setAnalysis(aiAnalysis);
      }
      
    } catch (err) {
      console.error('Error cargando datos de Waze:', err);
      setError('Error al cargar datos de tráfico. Usando datos de demostración.');
      
      // Como último recurso, cargar datos de demostración
      try {
        const fallbackData = await getWazeDataWithFallback();
        setWazeData(fallbackData);
        setDataSource('demo');
        const aiAnalysis = await aiService.analyzeTrafficData(fallbackData);
        setAnalysis(aiAnalysis);
      } catch (fallbackError) {
        console.error('Error incluso con datos de fallback:', fallbackError);
        setError('Error crítico al cargar datos de tráfico.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    loadWazeData();
  }, [wazeApiUrl]);

  // Función para obtener color según severidad
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffbb33';
      case 'low': return '#00bb00';
      default: return '#888888';
    }
  };

  // Función para obtener emoji según tipo de incidente
  const getIncidentEmoji = (type: string): string => {
    switch (type) {
      case 'HAZARD': return '⚠️';
      case 'ROAD_CLOSED': return '🚧';
      case 'ACCIDENT': return '🚗💥';
      case 'JAM': return '🚦';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <div className="waze-analysis loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <h3>🔄 Analizando tráfico con IA...</h3>
          <p>Procesando {wazeData?.alerts?.length || 0} alertas y {wazeData?.jams?.length || 0} congestiones</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waze-analysis error">
        <div className="error-message">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={loadWazeData} className="retry-button">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!wazeData || !analysis) {
    return (
      <div className="waze-analysis empty">
        <div className="empty-state">
          <h3>🚦 Análisis de Tráfico con IA</h3>
          <p>Proporciona una URL de API de Waze para comenzar el análisis</p>
          <button onClick={loadWazeData} className="load-button">
            📊 Cargar Datos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="waze-analysis">
      <div className="analysis-header">
        <h2>🚦 Análisis de Tráfico con IA</h2>
        <div className="stats-summary">
          <div className="stat">
            <span className="stat-number">{wazeData.alerts.length}</span>
            <span className="stat-label">Alertas</span>
          </div>
          <div className="stat">
            <span className="stat-number">{wazeData.jams.length}</span>
            <span className="stat-label">Congestiones</span>
          </div>
          <div className="stat">
            <span 
              className="stat-number"
              style={{ color: getSeverityColor(analysis.trafficPrediction.severity) }}
            >
              {analysis.trafficPrediction.severity.toUpperCase()}
            </span>
            <span className="stat-label">Severidad</span>
          </div>
        </div>
        <button onClick={loadWazeData} className="refresh-button">
          🔄 Actualizar
        </button>
      </div>

      {/* Indicador de fuente de datos */}
      <div className={`data-source-indicator ${dataSource}`}>
        {dataSource === 'api' ? (
          <span>✅ Datos en tiempo real desde API de Waze</span>
        ) : (
          <span>🔄 Datos de demostración - APIs no disponibles</span>
        )}
      </div>

      <div className="analysis-tabs">
        <button
          className={`tab ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          📈 Predicción de Tráfico
        </button>
        <button
          className={`tab ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          ⚠️ Análisis de Incidentes
        </button>
        <button
          className={`tab ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          🛣️ Optimización de Rutas
        </button>
        <button
          className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          💡 Insights de la Ciudad
        </button>
      </div>

      <div className="analysis-content">
        {activeTab === 'traffic' && (
          <div className="traffic-prediction">
            <h3>📈 Predicción de Tráfico</h3>
            
            <div className="prediction-card">
              <div className="severity-indicator">
                <div 
                  className="severity-circle"
                  style={{ backgroundColor: getSeverityColor(analysis.trafficPrediction.severity) }}
                ></div>
                <span>Severidad: {analysis.trafficPrediction.severity}</span>
              </div>
              
              <div className="prediction-details">
                <div className="detail-section">
                  <h4>⏰ Horas Pico</h4>
                  <ul>
                    {analysis.trafficPrediction.peakHours.map((hour, idx) => (
                      <li key={idx}>{hour}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="detail-section">
                  <h4>📍 Áreas Afectadas</h4>
                  <ul>
                    {analysis.trafficPrediction.affectedAreas.map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="detail-section">
                  <h4>💡 Recomendaciones</h4>
                  <ul>
                    {analysis.trafficPrediction.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="incident-analysis">
            <h3>⚠️ Análisis de Incidentes</h3>
            
            <div className="incidents-grid">
              <div className="incident-card">
                <h4>📊 Tipos de Incidentes</h4>
                <div className="incident-types">
                  {analysis.incidentAnalysis.mostCommonIncidents.map((incident, idx) => (
                    <div key={idx} className="incident-type">
                      <span className="incident-emoji">{getIncidentEmoji(incident.type)}</span>
                      <span className="incident-name">{incident.type}</span>
                      <span className="incident-count">{incident.count}</span>
                      <span className="incident-percentage">({incident.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="incident-card">
                <h4>🚨 Áreas de Alto Riesgo</h4>
                <div className="risk-areas">
                  {analysis.incidentAnalysis.highRiskAreas.map((area, idx) => (
                    <div key={idx} className="risk-area">
                      <div className="risk-header">
                        <span className="area-name">{area.area}</span>
                        <span className="risk-level">Riesgo: {area.riskLevel}/10</span>
                      </div>
                      <div className="risk-reasons">
                        {area.reasons.map((reason, ridx) => (
                          <span key={ridx} className="reason">{reason}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="incident-card">
                <h4>🔍 Patrones Detectados</h4>
                <ul className="patterns-list">
                  {analysis.incidentAnalysis.patterns.map((pattern, idx) => (
                    <li key={idx}>{pattern}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="route-optimization">
            <h3>🛣️ Optimización de Rutas</h3>
            
            <div className="route-sections">
              <div className="route-section">
                <h4>🚫 Áreas a Evitar</h4>
                <div className="avoid-areas">
                  {analysis.routeOptimization.avoidAreas.map((area, idx) => (
                    <div key={idx} className="avoid-area">
                      <span className="avoid-icon">⚠️</span>
                      <span>{area}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="route-section">
                <h4>⏰ Recomendaciones de Tiempo</h4>
                <ul className="time-recommendations">
                  {analysis.routeOptimization.timeRecommendations.map((rec, idx) => (
                    <li key={idx}>
                      <span className="time-icon">🕐</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="route-section">
                <h4>🗺️ Rutas Alternativas</h4>
                <div className="alternative-routes">
                  {analysis.routeOptimization.alternativeRoutes.map((route, idx) => (
                    <div key={idx} className="alternative-route">
                      <div className="route-header">
                        <span className="route-from">{route.from}</span>
                        <span className="route-arrow">→</span>
                        <span className="route-to">{route.to}</span>
                      </div>
                      <div className="route-suggestion">{route.suggestion}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="city-insights">
            <h3>💡 Insights de la Ciudad</h3>
            
            <div className="insights-grid">
              <div className="insight-card">
                <h4>🏥 Salud del Tráfico</h4>
                <div className="health-meter">
                  <div className="health-circle">
                    <div className="health-percentage">
                      {analysis.cityInsights.overallTrafficHealth}%
                    </div>
                  </div>
                  <div className="health-label">
                    {analysis.cityInsights.overallTrafficHealth > 70 ? 'Buena' : 
                     analysis.cityInsights.overallTrafficHealth > 40 ? 'Regular' : 'Mala'}
                  </div>
                </div>
              </div>
              
              <div className="insight-card">
                <h4>🚨 Áreas Problemáticas</h4>
                <ul className="problem-areas">
                  {analysis.cityInsights.problemAreas.map((area, idx) => (
                    <li key={idx}>
                      <span className="problem-icon">⚠️</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="insight-card">
                <h4>✨ Mejoras Sugeridas</h4>
                <ul className="improvements">
                  {analysis.cityInsights.improvements.map((improvement, idx) => (
                    <li key={idx}>
                      <span className="improvement-icon">💡</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="insight-card">
                <h4>📈 Tendencias</h4>
                <ul className="trends">
                  {analysis.cityInsights.trends.map((trend, idx) => (
                    <li key={idx}>
                      <span className="trend-icon">📊</span>
                      {trend}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WazeAnalysisComponent;
