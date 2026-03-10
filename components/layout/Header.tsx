'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { AddressDisplay } from '@/components/ui/AddressDisplay';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { getActiveWalletAddress } from '@/lib/wallet';

export function Header() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const address = getActiveWalletAddress(wallets);

  return (
    <header style={{
      padding: '20px 16px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid transparent',
      borderImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent) 1',
      background: 'rgba(0,0,0,0.85)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      {/* Logo & App name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: '#111111',
          border: '1.5px solid rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(255,255,255,0.08), inset 0 0 8px rgba(255,255,255,0.04)',
        }}>
          <img src="/retempo.svg" alt="RETEMPO Logo" style={{width: '18px', height: '18px', filter: 'brightness(0) invert(1)'}} />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}>
            ReTempo
          </div>
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}>
            Tempo Network
          </div>
        </div>
      </div>

      {/* Network badge + address + settings */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Monochrome network badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 9999,
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.75)',
          }}>
            <div className="status-dot" style={{ width: 5, height: 5 }} />
            Tempo • Testnet
          </div>
          <Link
            href="/settings"
            style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)';
              (e.currentTarget as HTMLElement).style.color = '#fff';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 8px rgba(255,255,255,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
            title="Account Settings"
          >
            <Settings size={14} />
          </Link>
        </div>
        {authenticated && address && (
          <AddressDisplay address={address} />
        )}
      </div>
    </header>
  );
}
