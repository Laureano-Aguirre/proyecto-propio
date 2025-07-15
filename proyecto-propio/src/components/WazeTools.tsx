import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import type { WazeAlert } from '../services/aiService';
import './WazeTools.css';

interface WazeToolsProps {
  alerts: WazeAlert[];
}

const WazeTools: React.FC<WazeToolsProps> = ({ alerts }) => {
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async (type: string) => {
    setLoading(true);
    setActiveAnalysis(type);
    
    try {
      let result;
      
      switch (type) {
        case 'prediction':
          result = await aiService.predictTrafficProblems(alerts, '24h');
          break;
          
        case 'routes':
          result = await aiService.generateOptimalRoutes(
            'Centro de Buenos Aires',
            'Zona Norte',
            alerts
          );
          break;
          
        case 'sentiment':
          const reports = alerts
            .filter(alert => alert.reportDescription)
            .map(alert => ({
              description: alert.reportDescription || '',
              area: alert.street + ', ' + alert.city
            }));
          result = await aiService.analyzeTrafficSentiment(reports);
          break;
          
        case 'patterns':
          result = await aiService.analyzeTrafficPatterns(alerts, '1week');
          break;
          
        case 'impact':
          result = await aiService.analyzeUrbanImpact(alerts, {
            population: 3000000,
            area: 'Buenos Aires',
            economicZones: ['Microcentro', 'Puerto Madero', 'Palermo']
          });
          break;
          
        default:
          result = null;
      }
      
      setAnalysisResults(result);
    } catch (error) {
      console.error('Error en análisis:', error);
      setAnalysisResults({ error: 'Error realizando análisis' });
    } finally {
      setLoading(false);
    }
  };

  const closeAnalysis = () => {
    setActiveAnalysis(null);
    setAnalysisResults(null);
  };

  return (
    <div className="waze-tools">
      <div className="tools-header">
        <h3>🛠️ Herramientas de Análisis Avanzado</h3>
        <p>Utiliza IA para análisis profundos de datos de tráfico</p>
      </div>

      <div className="tools-grid">
        <div className="tool-card" onClick={() => runAnalysis('prediction')}>
          <div className="tool-icon">🔮</div>
          <div className="tool-content">
            <h4>Predicción de Tráfico</h4>
            <p>Predice futuros problemas de tráfico basándose en patrones históricos</p>
          </div>
        </div>

        <div className="tool-card" onClick={() => runAnalysis('routes')}>
          <div className="tool-icon">🗺️</div>
          <div className="tool-content">
            <h4>Optimización de Rutas</h4>
            <p>Genera rutas optimizadas considerando el tráfico actual</p>
          </div>
        </div>

        <div className="tool-card" onClick={() => runAnalysis('sentiment')}>
          <div className="tool-icon">😊</div>
          <div className="tool-content">
            <h4>Análisis de Sentimientos</h4>
            <p>Analiza el estado de ánimo de los conductores en reportes</p>
          </div>
        </div>

        <div className="tool-card" onClick={() => runAnalysis('patterns')}>
          <div className="tool-icon">📊</div>
          <div className="tool-content">
            <h4>Patrones Temporales</h4>
            <p>Identifica patrones y tendencias en el tráfico</p>
          </div>
        </div>

        <div className="tool-card" onClick={() => runAnalysis('impact')}>
          <div className="tool-icon">🏙️</div>
          <div className="tool-content">
            <h4>Impacto Urbano</h4>
            <p>Analiza el impacto económico y social del tráfico</p>
          </div>
        </div>
      </div>

      {/* Modal de resultados */}
      {activeAnalysis && (
        <div className="analysis-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {activeAnalysis === 'prediction' && '🔮 Predicción de Tráfico'}
                {activeAnalysis === 'routes' && '🗺️ Optimización de Rutas'}
                {activeAnalysis === 'sentiment' && '😊 Análisis de Sentimientos'}
                {activeAnalysis === 'patterns' && '📊 Patrones Temporales'}
                {activeAnalysis === 'impact' && '🏙️ Impacto Urbano'}
              </h3>
              <button onClick={closeAnalysis} className="close-button">✕</button>
            </div>

            <div className="modal-body">
              {loading ? (
                <div className="loading-analysis">
                  <div className="spinner"></div>
                  <p>Analizando datos con IA...</p>
                </div>
              ) : (
                <div className="analysis-result">
                  {analysisResults && activeAnalysis === 'prediction' && (
                    <div className="prediction-results">
                      <h4>📈 Predicciones</h4>
                      {analysisResults.predictions?.length > 0 ? (
                        <div className="predictions-list">
                          {analysisResults.predictions.map((pred: any, idx: number) => (
                            <div key={idx} className="prediction-item">
                              <div className="prediction-header">
                                <span className="prediction-time">🕐 {pred.time}</span>
                                <span className="prediction-area">📍 {pred.area}</span>
                              </div>
                              <div className="prediction-details">
                                <span className="prediction-type">{pred.type}</span>
                                <span className="prediction-probability">
                                  {Math.round(pred.probability * 100)}% probabilidad
                                </span>
                                <span className={`prediction-severity ${pred.severity}`}>
                                  {pred.severity}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No se encontraron predicciones específicas</p>
                      )}
                      
                      <h4>💡 Recomendaciones</h4>
                      <ul className="recommendations-list">
                        {analysisResults.recommendations?.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResults && activeAnalysis === 'routes' && (
                    <div className="routes-results">
                      <h4>🛣️ Rutas Recomendadas</h4>
                      {analysisResults.routes?.map((route: any, idx: number) => (
                        <div key={idx} className="route-item">
                          <div className="route-header">
                            <h5>{route.name}</h5>
                            <span className="route-time">⏱️ {route.estimatedTime}</span>
                            <span className={`route-difficulty ${route.difficulty}`}>
                              {route.difficulty}
                            </span>
                          </div>
                          <div className="route-advantages">
                            <h6>✅ Ventajas:</h6>
                            <ul>
                              {route.advantages?.map((adv: string, aidx: number) => (
                                <li key={aidx}>{adv}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="route-warnings">
                            <h6>⚠️ Advertencias:</h6>
                            <ul>
                              {route.warnings?.map((warn: string, widx: number) => (
                                <li key={widx}>{warn}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                      
                      <div className="route-tips">
                        <h4>⏰ Mejor momento para viajar</h4>
                        <p>{analysisResults.bestTime}</p>
                        
                        <h4>💡 Consejos de tráfico</h4>
                        <ul>
                          {analysisResults.trafficTips?.map((tip: string, idx: number) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {analysisResults && activeAnalysis === 'sentiment' && (
                    <div className="sentiment-results">
                      <div className="sentiment-overview">
                        <h4>😊 Estado de Ánimo General</h4>
                        <div className="mood-indicator">
                          <div className={`mood-emoji ${analysisResults.overallMood}`}>
                            {analysisResults.overallMood === 'positive' ? '😊' : 
                             analysisResults.overallMood === 'negative' ? '😠' : '😐'}
                          </div>
                          <span>{analysisResults.overallMood}</span>
                        </div>
                      </div>

                      <div className="frustration-meter">
                        <h4>😤 Nivel de Frustración</h4>
                        <div className="meter">
                          <div 
                            className="meter-fill"
                            style={{ width: `${analysisResults.frustrationLevel * 10}%` }}
                          ></div>
                          <span className="meter-value">{analysisResults.frustrationLevel}/10</span>
                        </div>
                      </div>

                      <div className="sentiment-details">
                        <div className="complaints">
                          <h4>😠 Quejas Comunes</h4>
                          <ul>
                            {analysisResults.commonComplaints?.map((complaint: string, idx: number) => (
                              <li key={idx}>{complaint}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="satisfaction">
                          <h4>😊 Áreas de Satisfacción</h4>
                          <ul>
                            {analysisResults.satisfactionAreas?.map((area: string, idx: number) => (
                              <li key={idx}>{area}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {analysisResults && activeAnalysis === 'patterns' && (
                    <div className="patterns-results">
                      <div className="peak-hours">
                        <h4>⏰ Horas Pico</h4>
                        <div className="hours-grid">
                          {analysisResults.peakHours?.map((hour: any, idx: number) => (
                            <div key={idx} className="hour-item">
                              <span className="hour-time">{hour.hour}</span>
                              <div className="intensity-bar">
                                <div 
                                  className="intensity-fill"
                                  style={{ width: `${hour.intensity * 10}%` }}
                                ></div>
                              </div>
                              <span className="intensity-value">{hour.intensity}/10</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="weekly-patterns">
                        <h4>📅 Patrones Semanales</h4>
                        <div className="days-grid">
                          {analysisResults.weeklyPatterns?.map((day: any, idx: number) => (
                            <div key={idx} className="day-item">
                              <span className="day-name">{day.day}</span>
                              <span className={`day-severity ${day.severity}`}>
                                {day.severity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="anomalies">
                        <h4>🚨 Anomalías Detectadas</h4>
                        {analysisResults.anomalies?.map((anomaly: any, idx: number) => (
                          <div key={idx} className="anomaly-item">
                            <span className="anomaly-date">{anomaly.date}</span>
                            <span className="anomaly-type">{anomaly.type}</span>
                            <span className="anomaly-description">{anomaly.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResults && activeAnalysis === 'impact' && (
                    <div className="impact-results">
                      <div className="impact-section">
                        <h4>💰 Impacto Económico</h4>
                        <div className="impact-metrics">
                          <div className="metric">
                            <span className="metric-label">Productividad perdida:</span>
                            <span className="metric-value">{analysisResults.economicImpact?.lostProductivity}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Combustible desperdiciado:</span>
                            <span className="metric-value">{analysisResults.economicImpact?.fuelWaste}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Costos de salud:</span>
                            <span className="metric-value">{analysisResults.economicImpact?.healthCosts}</span>
                          </div>
                        </div>
                      </div>

                      <div className="impact-section">
                        <h4>🌍 Impacto Ambiental</h4>
                        <div className="impact-metrics">
                          <div className="metric">
                            <span className="metric-label">Emisiones:</span>
                            <span className="metric-value">{analysisResults.environmentalImpact?.emissions}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Nivel de contaminación:</span>
                            <span className="metric-value">{analysisResults.environmentalImpact?.pollutionLevel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="impact-section">
                        <h4>👥 Impacto Social</h4>
                        <div className="impact-metrics">
                          <div className="metric">
                            <span className="metric-label">Nivel de estrés:</span>
                            <span className="metric-value">{analysisResults.socialImpact?.stressLevel}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Calidad de vida:</span>
                            <span className="metric-value">{analysisResults.socialImpact?.qualityOfLife}</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Población afectada:</span>
                            <span className="metric-value">{analysisResults.socialImpact?.affectedPopulation}</span>
                          </div>
                        </div>
                      </div>

                      <div className="solutions">
                        <h4>💡 Soluciones Propuestas</h4>
                        <ul>
                          {analysisResults.solutions?.map((solution: string, idx: number) => (
                            <li key={idx}>{solution}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {analysisResults?.error && (
                    <div className="error-result">
                      <h4>❌ Error</h4>
                      <p>{analysisResults.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WazeTools;
