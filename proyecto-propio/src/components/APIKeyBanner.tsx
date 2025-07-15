import React from 'react';
import { FiInfo, FiZap } from 'react-icons/fi';
import './APIKeyBanner.css';

const APIKeyBanner: React.FC = () => {
  return (
    <div className="api-key-banner">
      <div className="banner-content">
        <FiInfo className="banner-icon" />
        <div className="banner-text">
          <h4>🚀 ¡Potencia tu OCR con IA!</h4>
          <p>
            Configura tu API Key de OpenAI para obtener:
            <span className="features">
              <FiZap /> Corrección automática de errores
              <FiZap /> Extracción de datos estructurados
              <FiZap /> Resúmenes inteligentes
              <FiZap /> Clasificación automática
            </span>
          </p>
        </div>
      </div>
      <div className="banner-actions">
        <a 
          href="https://platform.openai.com/api-keys" 
          target="_blank" 
          rel="noopener noreferrer"
          className="get-key-btn"
        >
          Obtener API Key
        </a>
      </div>
    </div>
  );
};

export default APIKeyBanner;
