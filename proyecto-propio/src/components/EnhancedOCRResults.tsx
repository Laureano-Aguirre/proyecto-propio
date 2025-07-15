import React, { useState } from 'react';
import { FiCopy, FiDownload, FiEye, FiFileText, FiCode, FiRefreshCw } from 'react-icons/fi';
import type { EnhancedOCRResult } from '../types';
import './EnhancedOCRResults.css';

interface EnhancedOCRResultsProps {
  result: EnhancedOCRResult;
  onRetry?: () => void;
  isLoading?: boolean;
}

const EnhancedOCRResults: React.FC<EnhancedOCRResultsProps> = ({ 
  result, 
  onRetry, 
  isLoading = false 
}) => {
  const [activeTab, setActiveTab] = useState<'corrected' | 'original' | 'structured' | 'summary'>('corrected');
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando texto:', error);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDocumentTypeIcon = (type: string) => {
    const icons = {
      invoice: '🧾',
      recipe: '👨‍🍳',
      handwritten: '✍️',
      'business-card': '💼',
      book: '📚',
      notes: '📝',
      other: '📄'
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10B981'; // Verde
    if (confidence >= 0.6) return '#F59E0B'; // Amarillo
    return '#EF4444'; // Rojo
  };

  const renderStructuredData = () => {
    if (!result.extractedData || Object.keys(result.extractedData).length === 0) {
      return <p className="no-data">No se encontraron datos estructurados</p>;
    }

    return (
      <div className="structured-data">
        {Object.entries(result.extractedData).map(([key, value]) => (
          <div key={key} className="data-field">
            <label className="field-label">{key}:</label>
            <div className="field-value">
              {Array.isArray(value) ? (
                <ul className="field-list">
                  {value.map((item, index) => (
                    <li key={index}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
                  ))}
                </ul>
              ) : (
                <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="enhanced-results loading">
        <div className="loading-spinner">
          <FiRefreshCw className="spin" />
          <p>Mejorando texto con IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-results">
      <div className="results-header">
        <div className="document-info">
          <div className="document-type">
            <span className="doc-icon">{getDocumentTypeIcon(result.documentType.type)}</span>
            <div>
              <h3>{result.documentType.description}</h3>
              <div className="confidence-badge">
                <span 
                  className="confidence-dot"
                  style={{ backgroundColor: getConfidenceColor(result.confidence) }}
                />
                Confianza: {Math.round(result.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={() => handleCopy(result.correctedText)}
            className="action-btn copy-btn"
            title="Copiar texto corregido"
          >
            <FiCopy /> {copied ? 'Copiado!' : 'Copiar'}
          </button>
          
          <button 
            onClick={() => handleDownload(result.correctedText, 'texto-extraido.txt')}
            className="action-btn download-btn"
            title="Descargar texto"
          >
            <FiDownload /> Descargar
          </button>
          
          {onRetry && (
            <button 
              onClick={onRetry}
              className="action-btn retry-btn"
              title="Procesar de nuevo"
            >
              <FiRefreshCw /> Reintentar
            </button>
          )}
        </div>
      </div>

      <div className="results-tabs">
        <button 
          className={`tab-button ${activeTab === 'corrected' ? 'active' : ''}`}
          onClick={() => setActiveTab('corrected')}
        >
          <FiFileText /> Texto Corregido
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'original' ? 'active' : ''}`}
          onClick={() => setActiveTab('original')}
        >
          <FiEye /> Texto Original
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'structured' ? 'active' : ''}`}
          onClick={() => setActiveTab('structured')}
        >
          <FiCode /> Datos Estructurados
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <FiFileText /> Resumen
        </button>
      </div>

      <div className="results-content">
        {activeTab === 'corrected' && (
          <div className="text-result">
            <div className="text-container">
              <pre className="text-content">{result.correctedText}</pre>
            </div>
          </div>
        )}
        
        {activeTab === 'original' && (
          <div className="text-result">
            <div className="text-container">
              <pre className="text-content original">{result.originalText}</pre>
            </div>
          </div>
        )}
        
        {activeTab === 'structured' && renderStructuredData()}
        
        {activeTab === 'summary' && (
          <div className="summary-result">
            <div className="summary-container">
              <p className="summary-text">{result.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedOCRResults;
