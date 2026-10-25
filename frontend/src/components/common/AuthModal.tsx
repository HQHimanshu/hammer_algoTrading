import React, { useState } from 'react';
import { X, Terminal, Zap, ShieldCheck, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (userEmail: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signup',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('quant.trader@hammer.io');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  // Sync mode if initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess(email || 'trader@hammer.io');
      onClose();
    }, 400);
  };

  const handleInstantDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSuccess('demo.sandbox@hammer.io');
      onClose();
    }, 250);
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#090a0d',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '16px',
          padding: '36px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255, 255, 255, 0.05)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: '#a1a1aa',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onClose}
          type="button"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div className="bw-logo-icon" style={{ width: '28px', height: '28px' }}>
            <Terminal size={16} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff' }}>Hammer Quant</span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#34d399',
              background: 'rgba(52, 211, 153, 0.12)',
              padding: '2px 6px',
              borderRadius: '4px',
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheck size={12} /> SECURE 256-BIT
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '3px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'signup' ? '#ffffff' : 'transparent',
              color: mode === 'signup' ? '#000000' : '#a1a1aa',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? '#000000' : '#a1a1aa',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Log In
          </button>
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
          {mode === 'signup' ? 'Create Your Quant Account' : 'Welcome Back'}
        </h3>
        <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '22px', lineHeight: 1.5 }}>
          {mode === 'signup'
            ? 'Institutional access to low-latency F&O, Options Greeks, and Algorithmic Execution.'
            : 'Enter your credentials to access your live quant algorithms and margin portfolio.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Trader Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@hedgefund.com"
              required
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 14px',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 14px',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            className="bw-btn-signup"
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLoading ? 'Authenticating...' : mode === 'signup' ? 'Sign Up & Launch Terminal' : 'Log In to Terminal'}
          </button>

          <div style={{ textAlign: 'center', margin: '4px 0', fontSize: '12px', color: '#71717a' }}>
            OR
          </div>

          <button
            type="button"
            onClick={handleInstantDemo}
            style={{
              width: '100%',
              padding: '11px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <Zap size={15} color="#eab308" />
            Instant 1-Click Sandbox Demo Access
          </button>
        </form>
      </div>
    </div>
  );
};
