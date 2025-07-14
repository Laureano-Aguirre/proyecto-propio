import { useState } from 'react'
import { formatDate } from './utils'
import { useLocalStorage } from './hooks'
import OCRCamera from './components/OCRCamera'
import './App.css'

function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'light')
  const [showOCR, setShowOCR] = useState(false)
  
  const currentDate = formatDate(new Date())

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (showOCR) {
    return (
      <div className={`app ${theme}`}>
        <header className="app-header">
          <h1>🔍 OCR con Cámara</h1>
          <p>Reconocimiento de texto en tiempo real</p>
          <button onClick={() => setShowOCR(false)} className="back-button">
            ← Volver al inicio
          </button>
        </header>
        <main className="app-main">
          <OCRCamera />
        </main>
      </div>
    )
  }

  return (
    <div className={`app ${theme}`}>
      <header className="app-header">
        <div className="ocr-hero">
          <div className="ocr-icon">👁️‍🗨️</div>
          <h1>VisionText</h1>
          <p className="subtitle">Reconocimiento óptico de caracteres con IA</p>
          <p className="date">📅 {currentDate}</p>
        </div>
      </header>

      <main className="app-main">
        <div className="hero-section">
          <h2>🔍 Convierte imágenes en texto al instante</h2>
          <p className="hero-description">
            Utiliza la potencia de la inteligencia artificial para extraer texto de cualquier imagen 
            capturada con tu cámara web. Perfecto para digitalizar documentos, notas escritas a mano, 
            carteles, libros y mucho más.
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
            <div className="feature-icon">⚙️</div>
            <h3>Personalizable</h3>
            <p>Ajusta configuraciones de procesamiento según tu tipo de contenido</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Multiidioma</h3>
            <p>Soporte para español, inglés, francés, alemán y más idiomas</p>
          </div>
        </div>

        <div className="cta-section">
          <button 
            onClick={() => setShowOCR(true)}
            className="cta-button"
          >
            � Comenzar reconocimiento
          </button>
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
        <p>✨ Powered by React + TypeScript + Tesseract.js</p>
      </footer>
    </div>
  )
}

export default App
