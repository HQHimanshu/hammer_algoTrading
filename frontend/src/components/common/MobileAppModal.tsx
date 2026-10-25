import React from 'react';
import { X, Smartphone, Download, QrCode, Shield, CheckCircle } from 'lucide-react';

interface MobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppModal: React.FC<MobileAppModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
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

        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <Smartphone size={32} color="#ffffff" />
        </div>

        <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
          Trade F&amp;O On the Go
        </h3>
        <p style={{ fontSize: '13.5px', color: '#a1a1aa', marginBottom: '22px', lineHeight: 1.5 }}>
          Scan the QR code to install the Hammer Mobile Quant Terminal for iOS and Android with ultra-low latency alerts.
        </p>

        {/* QR Code Container */}
        <div
          style={{
            width: '180px',
            height: '180px',
            background: '#ffffff',
            borderRadius: '12px',
            margin: '0 auto 20px auto',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          }}
        >
          <svg width="156" height="156" viewBox="0 0 100 100" fill="#000000">
            <rect x="10" y="10" width="25" height="25" fill="#000" />
            <rect x="15" y="15" width="15" height="15" fill="#fff" />
            <rect x="19" y="19" width="7" height="7" fill="#000" />

            <rect x="65" y="10" width="25" height="25" fill="#000" />
            <rect x="70" y="15" width="15" height="15" fill="#fff" />
            <rect x="74" y="19" width="7" height="7" fill="#000" />

            <rect x="10" y="65" width="25" height="25" fill="#000" />
            <rect x="15" y="70" width="15" height="15" fill="#fff" />
            <rect x="19" y="74" width="7" height="7" fill="#000" />

            <rect x="42" y="15" width="8" height="8" fill="#000" />
            <rect x="52" y="25" width="6" height="6" fill="#000" />
            <rect x="42" y="38" width="18" height="6" fill="#000" />
            <rect x="45" y="55" width="10" height="10" fill="#000" />
            <rect x="65" y="45" width="12" height="6" fill="#000" />
            <rect x="78" y="58" width="12" height="12" fill="#000" />
            <rect x="40" y="75" width="15" height="15" fill="#000" />
            <rect x="60" y="75" width="8" height="15" fill="#000" />
          </svg>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34d399', fontSize: '12px', fontWeight: 600, marginBottom: '20px' }}>
          <CheckCircle size={14} /> Biometric FaceID &amp; 1-Tap Scalp Orders
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="bw-app-badge"
            type="button"
            style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '13px' }}
            onClick={onClose}
          >
            App Store (iOS)
          </button>
          <button
            className="bw-app-badge"
            type="button"
            style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '13px' }}
            onClick={onClose}
          >
            Google Play (Android)
          </button>
        </div>
      </div>
    </div>
  );
};
