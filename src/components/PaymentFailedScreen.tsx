"use client";

import React, { useEffect, useState } from "react";
import { XCircle, Home } from "lucide-react";

interface PaymentFailedScreenProps {
  onGoHome?: () => void;
  onContactSupport?: () => void;
  errorMessage?: string;
}

const PaymentFailedScreen: React.FC<PaymentFailedScreenProps> = ({
  onGoHome,
  onContactSupport,
  errorMessage = "Payment verification failed"
}) => {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // Show buttons after animation
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom right, #f87171, #ef4444, #f43f5e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Shapes */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Large Circles */}
        <div 
          style={{
            position: 'absolute',
            top: '-5rem',
            left: '-5rem',
            width: '24rem',
            height: '24rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            filter: 'blur(64px)',
            animation: 'blob 7s ease-in-out infinite'
          }}
        ></div>
        <div 
          style={{
            position: 'absolute',
            top: '25%',
            right: '-8rem',
            width: '31.25rem',
            height: '31.25rem',
            background: 'rgba(251, 207, 232, 0.2)',
            borderRadius: '9999px',
            filter: 'blur(64px)',
            animation: 'blob 7s ease-in-out infinite 2s'
          }}
        ></div>
        <div 
          style={{
            position: 'absolute',
            bottom: '-8rem',
            left: '33.333%',
            width: '28.125rem',
            height: '28.125rem',
            background: 'rgba(252, 165, 165, 0.15)',
            borderRadius: '9999px',
            filter: 'blur(64px)',
            animation: 'blob 7s ease-in-out infinite 4s'
          }}
        ></div>

        {/* Grid Pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(to right, white 1px, transparent 1px),
                linear-gradient(to bottom, white 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          ></div>
        </div>

        {/* Floating Particles */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '0.75rem',
          height: '0.75rem',
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '9999px',
          animation: 'float-particle 8s ease-in infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '33.333%',
          right: '25%',
          width: '0.5rem',
          height: '0.5rem',
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '9999px',
          animation: 'float-particle 8s ease-in infinite 1s'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '33.333%',
          left: '33.333%',
          width: '1rem',
          height: '1rem',
          background: 'rgba(255, 255, 255, 0.4)',
          borderRadius: '9999px',
          animation: 'float-particle 8s ease-in infinite 2s'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '66.666%',
          right: '33.333%',
          width: '0.5rem',
          height: '0.5rem',
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '9999px',
          animation: 'float-particle 8s ease-in infinite 3s'
        }}></div>
      </div>

      <div style={{ textAlign: 'center', padding: '0 1.5rem', position: 'relative', zIndex: 10, maxWidth: '28rem' }}>
        {/* Error Icon */}
        <div style={{ marginBottom: '2rem', display: 'inline-block', animation: 'shake 0.6s ease-in-out' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              animation: 'pulse-slow 2s ease-in-out infinite'
            }}>
              <div style={{
                width: '8rem',
                height: '8rem',
                borderRadius: '9999px',
                background: 'white',
                opacity: 0.2
              }}></div>
            </div>
            <div style={{
              position: 'relative',
              background: 'white',
              borderRadius: '9999px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <XCircle style={{ width: '5rem', height: '5rem', color: '#ef4444', strokeWidth: 2.5 }} />
            </div>
          </div>
        </div>

        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '1rem',
          animation: 'fade-in 0.6s ease-out'
        }}>
          Payment Failed
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '0.5rem',
          animation: 'fade-in-delay 0.8s ease-out'
        }}>
          {errorMessage}
        </p>
        
        <p style={{
          fontSize: '1rem',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '2rem',
          animation: 'fade-in-delay-2 1s ease-out'
        }}>
          Don't worry, no charges were made to your account
        </p>

        {/* Action Buttons */}
        {showButtons && (
          <div style={{ animation: 'slide-up 0.5s ease-out' }}>
            {onGoHome && (
              <button
                onClick={onGoHome}
                style={{
                  width: '100%',
                  background: 'white',
                  color: '#dc2626',
                  fontWeight: '600',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  fontSize: '1rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Home size={20} />
                Go to Home
              </button>
            )}
          </div>
        )}

        {onContactSupport && (
          <button
            onClick={onContactSupport}
            style={{
              marginTop: '1.5rem',
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              animation: 'fade-in-delay-3 1.2s ease-out',
              fontWeight: '500'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
          >
            Need help? Contact our support team →
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-delay {
          0%, 20% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-delay-2 {
          0%, 40% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-delay-3 {
          0%, 60% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float-particle {
          0% { transform: translateY(0px) translateX(0px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PaymentFailedScreen;