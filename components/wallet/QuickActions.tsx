'use client';

import Link from 'next/link';
import { Send, QrCode, ArrowLeftRight, History, Droplets, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { useFaucet } from '@/hooks/useFaucet';
import { getActiveWalletAddress } from '@/lib/wallet';

export function QuickActions() {
  const { wallets } = useWallets();
  const address = getActiveWalletAddress(wallets);

  const { requestTokens, status: faucetState, error: faucetErr, reset: resetFaucet } = useFaucet();

  const handleFaucet = async () => {
    if (!address || faucetState === 'loading') return;
    await requestTokens(address);
    setTimeout(resetFaucet, 4000);
  };

  const ACTIONS = [
    { label: 'Send',    href: '/send',    icon: Send },
    { label: 'Receive', href: '/receive', icon: QrCode },
    { label: 'Swap',    href: '/swap',    icon: ArrowLeftRight },
    { label: 'History', href: '/history', icon: History },
  ];


  const faucetLabel =
    faucetState === 'idle'    ? 'Faucet'         :
    faucetState === 'loading' ? 'Requesting…'    :
    faucetState === 'success' ? 'Funded! 1M'     :
    faucetErr                 ? faucetErr.slice(0, 14) + '…'
                              : 'Error';

  return (
    <div className="animate-fade-in-up" style={{ margin: '8px 0 20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8,
      }}>
        {ACTIONS.map(action => (
          <Link
            key={action.href}
            href={action.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '14px 4px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              textDecoration: 'none',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = `rgba(255,255,255,0.2)`;
              (e.currentTarget as HTMLElement).style.background = `rgba(255,255,255,0.04)`;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(255,255,255,0.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: `var(--bg-elevated)`,
              border: `1.5px solid var(--border)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              <action.icon size={18} color="var(--text-secondary)" />
            </div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '0.01em',
            }}>
              {action.label}
            </span>
          </Link>
        ))}

        {/* ── Faucet Button ───────────────────────────────────── */}
        <button
          id="faucet-btn"
          onClick={handleFaucet}
          disabled={faucetState === 'loading' || !address}
          title={faucetErr || 'Request 1M test tokens (each) to your wallet'}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '14px 4px',
            background: 'var(--bg-card)',
            border: `1px solid ${
              faucetState === 'success' ? 'rgba(16,185,129,0.4)' :
              faucetState === 'error'   ? 'rgba(244,63,94,0.4)' :
              'var(--border)'
            }`,
            borderRadius: 'var(--radius-lg)',
            transition: 'all 0.2s',
            cursor: faucetState === 'loading' ? 'wait' : 'pointer',
            opacity: (!address || faucetState === 'loading') ? 0.65 : 1,
            outline: 'none',
          }}
          onMouseEnter={e => {
            if (faucetState !== 'loading') {
              (e.currentTarget as HTMLElement).style.borderColor = `rgba(255,255,255,0.25)`;
              (e.currentTarget as HTMLElement).style.background = `rgba(255,255,255,0.06)`;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(255,255,255,0.06)';
            }
          }}
          onMouseLeave={e => {
            if (faucetState !== 'loading') {
              (e.currentTarget as HTMLElement).style.borderColor =
                faucetState === 'success' ? 'rgba(16,185,129,0.4)' :
                faucetState === 'error'   ? 'rgba(244,63,94,0.4)'  : 'var(--border)';
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background:
              faucetState === 'success' ? 'rgba(16,185,129,0.15)' :
              faucetState === 'error'   ? 'rgba(244,63,94,0.15)'  :
              'rgba(255,255,255,0.08)',
            border: `1.5px solid ${
              faucetState === 'success' ? 'rgba(16,185,129,0.35)' :
              faucetState === 'error'   ? 'rgba(244,63,94,0.35)'  :
              'rgba(255,255,255,0.2)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            {faucetState === 'loading' ? (
              <Loader2 size={18} color="#ffffff" style={{ animation: 'spin 1s linear infinite' }} />
            ) : faucetState === 'success' ? (
              <CheckCircle2 size={18} color="#10b981" />
            ) : faucetState === 'error' ? (
              <AlertCircle size={18} color="#f43f5e" />
            ) : (
              <Droplets size={18} color="#ffffff" />
            )}
          </div>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            color:
              faucetState === 'success' ? '#10b981' :
              faucetState === 'error'   ? '#f43f5e' :
              faucetState === 'loading' ? '#ffffff' :
              'var(--text-secondary)',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            maxWidth: 58,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {faucetLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
