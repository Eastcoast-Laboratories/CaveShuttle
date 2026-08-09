import React from 'react';

export default function HUD({ score, lives, level, fuel }) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      padding: '15px 25px',
      background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(20, 20, 20, 0.95))',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        color: '#fff',
      }}>
        <span style={{ color: '#888', fontSize: '12px' }}>SCORE</span>
        <span style={{ 
          color: '#00ff88', 
          fontWeight: '700',
          fontSize: '16px',
          fontFamily: 'monospace',
        }}>{score}</span>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        color: '#fff',
      }}>
        <span style={{ color: '#888', fontSize: '12px' }}>LIVES</span>
        <span style={{ color: '#ff4444', fontWeight: '700' }}>
          {lives > 10 ? '∞ ❤️' : '❤️'.repeat(Math.max(0, lives))}
        </span>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        color: '#fff',
      }}>
        <span style={{ color: '#888', fontSize: '12px' }}>LEVEL</span>
        <span style={{ 
          color: '#4488ff', 
          fontWeight: '700',
          fontSize: '16px',
        }}>{level}</span>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        color: '#fff',
      }}>
        <span style={{ color: '#888', fontSize: '12px' }}>FUEL</span>
        <div style={{ 
          width: '80px', 
          height: '8px', 
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{ 
            width: `${Math.max(0, fuel)}%`, 
            height: '100%',
            background: fuel > 30 
              ? 'linear-gradient(90deg, #00ff88, #00cc66)' 
              : 'linear-gradient(90deg, #ff4444, #cc2222)',
            borderRadius: '4px',
            transition: 'width 0.2s ease',
          }} />
        </div>
      </div>
    </div>
  );
}
