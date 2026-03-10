'use client';

import { useTokenBalances } from '@/hooks/useTokenBalances';
import { TokenIcon } from '@/components/ui/TokenIcon';
import { SUPPORTED_TOKENS } from '@/lib/config';

export function BalanceCard() {
  const { balances, isLoading } = useTokenBalances();

  const hubBalance = balances.find(b => b.isHub);

  return (
    <div className="card-accent animate-fade-in-up" style={{
      padding: '28px 20px',
      margin: '16px 0',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: -30,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 200,
        height: 120,
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
        animation: 'pulse-glow 4s ease-in-out infinite alternate',
      }} />

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
        Wallet Balance
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div className="skeleton" style={{ width: 160, height: 44, borderRadius: 8 }} />
        </div>
      ) : (
        <div className="animate-fade-in" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.2rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginBottom: 4,
          textShadow: '0 0 20px rgba(255,255,255,0.3)',
        }}>
          {hubBalance?.balance ?? '0.0000'}
          <span style={{ fontSize: '0.88rem', color: 'var(--accent)', marginLeft: 8, textShadow: 'none' }}>
            {hubBalance?.symbol}
          </span>
        </div>
      )}

      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginBottom: 20,
      }}>
        Hub Token · AlphaUSD
      </div>

      {/* Mini token row */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {SUPPORTED_TOKENS.map(token => {
          const bal = balances.find(b => b.address === token.address);
          return (
            <div key={token.address} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              minWidth: 80,
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            }}>
              <div style={{ filter: 'grayscale(100%) brightness(1.5)' }}>
                <TokenIcon token={token} size={28} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {token.symbol}
              </span>
              {isLoading ? (
                <div className="skeleton" style={{ width: 48, height: 12 }} />
              ) : (
                <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)' }}>
                  {bal?.balance ?? '0.0000'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
