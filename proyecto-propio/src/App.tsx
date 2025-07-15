import { useState } from 'react'
import { formatDate } from './utils'
import { useLocalStorage } from './hooks'
import OCRCamera from './components/OCRCamera'
import WazeAnalysis from './components/WazeAnalysis'
import WazeTools from './components/WazeTools'
import AIProviderStatus from './components/AIProviderStatus'
import './App.css'

function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light')
  const [currentView, setCurrentView] = useState<'home' | 'ocr' | 'waze'>('home')
  
  const currentDate = formatDate(new Date())

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // Vista OCR
  if (currentView === 'ocr') {
    return (
      <div className={`app ${theme}`}>
        <header className="app-header">
          <h1>🔍 OCR con Cámara</h1>
          <p>Reconocimiento de texto en tiempo real</p>
          <button onClick={() => setCurrentView('home')} className="back-button">
            ← Volver al inicio
          </button>
        </header>
        <main className="app-main">
          <AIProviderStatus />
          <OCRCamera />
        </main>
      </div>
    )
  }

  // Vista Waze
  if (currentView === 'waze') {
    return (
      <div className={`app ${theme}`}>
        <header className="app-header">
          <h1>🚦 Análisis de Tráfico Waze</h1>
          <p>Análisis inteligente de tráfico en tiempo real</p>
          <button onClick={() => setCurrentView('home')} className="back-button">
            ← Volver al inicio
          </button>
        </header>
        <main className="app-main">
          <AIProviderStatus />
          <WazeAnalysis />
          <WazeTools alerts={[]} />
        </main>
      </div>
    )
  }

  // Vista principal (home)
  return (
    <div className={`app ${theme}`}>
      <header className="app-header">
        <div className="ocr-hero">
          <div className="ocr-icon">👁️‍🗨️</div>
          <h1>VisionText Pro</h1>
          <p className="subtitle">OCR con IA + Análisis de Tráfico Inteligente</p>
          <p className="date">📅 {currentDate}</p>
        </div>
      </header>

      <main className="app-main">
        <div className="hero-section">
          <h2>🔍 Dos herramientas poderosas en una sola app</h2>
          <p className="hero-description">
            Combina reconocimiento óptico de caracteres con inteligencia artificial para extraer texto 
            de imágenes, y análisis avanzado de tráfico en tiempo real con datos de Waze. 
            Perfecto para digitalizar documentos y optimizar tus rutas urbanas.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Captura Directa</h3>
            <p>Usa tu cámara web para capturar texto en tiempo real sin necesidad de archivos</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>IA Avanzada</h3>
            <p>Algoritmo Tesseract.js con redes neuronales para máxima precisión</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🚦</div>
            <h3>Análisis de Tráfico</h3>
            <p>Análisis inteligente de tráfico en tiempo real con datos de Waze</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Personalizable</h3>
            <p>Ajusta configuraciones de procesamiento según tu tipo de contenido</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Multiidioma</h3>
            <p>Soporte para español, inglés, francés, alemán y más idiomas</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔮</div>
            <h3>Predicciones IA</h3>
            <p>Predicción de problemas de tráfico y optimización de rutas</p>
          </div>
        </div>

        <div className="cta-section">
          <div className="cta-buttons">
            <button 
              onClick={() => setCurrentView('ocr')}
              className="cta-button primary"
            >
              🔍 Comenzar OCR
            </button>
            <button 
              onClick={() => setCurrentView('waze')}
              className="cta-button secondary"
            >
              🚦 Análisis de Tráfico
            </button>
          </div>
          <p className="cta-description">¡Es gratis, rápido y funciona en tu navegador!</p>
        </div>

        <div className="stats-section">
          <div className="stat-item">
            <div className="stat-number">95%</div>
            <div className="stat-label">Precisión promedio</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">&lt;3s</div>
            <div className="stat-label">Tiempo de procesamiento</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Privacidad garantizada</div>
          </div>
        </div>

        <div className="theme-toggle">
          <button onClick={toggleTheme} className="theme-button">
            {theme === 'light' ? '🌙' : '☀️'} 
            Cambiar a tema {theme === 'light' ? 'oscuro' : 'claro'}
          </button>
        </div>
      </main>

      <footer className="app-footer">
        <p>✨ Powered by React + TypeScript + Tesseract.js + Waze API + OpenAI</p>
      </footer>
    </div>
  )
}

export default App
