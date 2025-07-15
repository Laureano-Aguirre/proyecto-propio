import React, { useState, useEffect } from 'react';
import { aiService } from '../services/aiService';
import './AIProviderStatus.css';

interface AIProviderStatusProps {
  className?: string;
}

const AIProviderStatus: React.FC<AIProviderStatusProps> = ({ className = '' }) => {
  const [provider, setProvider] = useState(aiService.getCurrentProvider());
  const [providerInfo, setProviderInfo] = useState(aiService.getProviderInfo());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string | null>(null);

  useEffect(() => {
    const updateInfo = () => {
      setProvider(aiService.getCurrentProvider());
      setProviderInfo(aiService.getProviderInfo());
    };

    // Actualizar cada 5 segundos
    const interval = setInterval(updateInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);
    
    try {
      const result = await aiService.testConnection();
      setConnectionResult(result.success ? 
        `✅ Conexión exitosa con ${result.provider}` : 
        `❌ Error: ${result.message}`
      );
    } catch (error) {
      setConnectionResult('❌ Error probando conexión');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getProviderIcon = () => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'huggingface': return '🤗';
      default: return '⚙️';
    }
  };

  const getProviderColor = () => {
    if (!providerInfo.available) return '#f59e0b';
    switch (provider) {
      case 'openai': return '#10b981';
      case 'huggingface': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const changeProvider = (newProvider: 'openai' | 'huggingface' | 'none') => {
    aiService.setProvider(newProvider);
    setProvider(newProvider);
    setProviderInfo(aiService.getProviderInfo());
    setConnectionResult(null);
  };

  return (
    <div className={`ai-provider-status ${className}`}>
      <div className="provider-info">
        <div className="provider-badge" style={{ backgroundColor: getProviderColor() }}>
          <span className="provider-icon">{getProviderIcon()}</span>
          <span className="provider-name">{providerInfo.name}</span>
          <span className="provider-status">
            {providerInfo.available ? '✅' : '⚠️'}
          </span>
        </div>
        <p className="provider-description">{providerInfo.description}</p>
      </div>

      <div className="provider-controls">
        <div className="provider-switcher">
          <label>Cambiar proveedor:</label>
          <select 
            value={provider} 
            onChange={(e) => changeProvider(e.target.value as any)}
          >
            <option value="huggingface">🤗 Hugging Face (Gratis)</option>
            <option value="openai">🤖 OpenAI (Pago)</option>
            <option value="none">⚙️ Análisis Básico</option>
          </select>
        </div>

        <button 
          onClick={testConnection}
          disabled={isTestingConnection}
          className="test-connection-btn"
        >
          {isTestingConnection ? '🔄 Probando...' : '🔍 Probar Conexión'}
        </button>
      </div>

      {connectionResult && (
        <div className={`connection-result ${connectionResult.includes('✅') ? 'success' : 'error'}`}>
          {connectionResult}
        </div>
      )}

      {provider === 'none' && (
        <div className="setup-instructions">
          <h4>🚀 Configurar IA Gratuita</h4>
          <p>Para análisis avanzado, configura Hugging Face:</p>
          <ol>
            <li>Crea cuenta en <a href="https://huggingface.co/join" target="_blank" rel="noopener noreferrer">huggingface.co</a></li>
            <li>Genera token en <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">settings/tokens</a></li>
            <li>Agrega a .env.local: <code>VITE_HUGGINGFACE_TOKEN=tu_token</code></li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default AIProviderStatus;
