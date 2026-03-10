'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Zap, Wallet } from 'lucide-react';

export default function LoginPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace('/dashboard');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--bg-base)',
      padding: '60px 28px 48px',
      maxWidth: 430,
      margin: '0 auto',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background gradient orb */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
        animation: 'pulse-glow 5s infinite alternate ease-in-out',
      }} />

      <div />

      {/* Hero Section */}
      <div className="animate-fade-in-up" style={{ position: 'relative' }}>
        {/* Logo */}
        <div style={{
          width: 88,
          height: 88,
          borderRadius: 26,
          background: '#0a0a0a',
          border: '1.5px solid rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          boxShadow: '0 0 40px rgba(255,255,255,0.1), inset 0 0 20px rgba(255,255,255,0.05)',
        }} className="animate-pulse-glow">
          <img src="/retempo.svg" alt="ReTempo Logo" style={{width: '44px', height: '44px', filter: 'brightness(0) invert(1)'}} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.4rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: 12,
          animation: 'glitch 4s infinite alternate none',
        }}>
          ReTempo
        </h1>

        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: 300,
          margin: '0 auto 40px',
        }}>
          Your gateway to Tempo Network. Send, receive, and swap stablecoins instantly.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          {[
            { icon: '⚡', label: 'Instant Routing' },
            { icon: '🔒', label: 'Embedded Wallet' },
            { icon: '💱', label: 'Auto Swap' },
          ].map(pill => (
            <div key={pill.label} className="badge badge-mono" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
              {pill.icon} {pill.label}
            </div>
          ))}
        </div>
      </div>

      {/* Login Section */}
      <div className="animate-fade-in-up" style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div className="card-glass" style={{
          padding: '28px 24px',
          borderTop: '1px solid rgba(255,255,255,0.3)',
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Sign In or Create Wallet
          </div>

          <button
            id="privy-login-btn"
            className="btn btn-primary"
            onClick={login}
            style={{ width: '100%', padding: '16px', fontSize: '1rem', borderRadius: 'var(--radius-lg)' }}
          >
            <Zap size={18} fill="currentColor" />
            Continue with Email / Google
          </button>

          <button
            id="web3-login-btn"
            className="btn btn-ghost"
            onClick={() => login({ loginMethods: ['wallet'] })}
            style={{ width: '100%', marginTop: 16, padding: '14px' }}
          >
            <Wallet size={16} />
            Connect Wallet (Web3)
          </button>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          A wallet is automatically created for you on first login.
          Powered by Privy embedded wallets on Tempo Blockchain.
        </p>
      </div>
    </div>
  );
}
