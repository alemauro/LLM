import React from 'react';
import { Statistics } from '../types';

interface HeaderProps {
  statistics: Statistics;
  onShowAboutModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ statistics, onShowAboutModal }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <img src="/logo-compacto.png" alt="Logo" className="header-logo" />
          <h1 className="header-title">Grandes Modelos de Lenguaje (LLM)</h1>
        </div>
        
        <div className="header-center">
          <div className="statistics-counter">
            <span className="statistics-label">Prompts generados:</span>
            <span className="statistics-value">
              {statistics.promptCount.toLocaleString('es-ES')}
            </span>
          </div>
        </div>

        <div className="header-right">
          <button 
            type="button"
            onClick={onShowAboutModal}
            className="about-button"
            title="Información sobre la aplicación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Acerca de
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;