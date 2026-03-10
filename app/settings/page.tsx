'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import {
  ArrowLeft, Copy, Key, Shield, LogOut, ChevronRight,
  CheckCircle2, ExternalLink, Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { getActiveWalletAddress } from '@/lib/wallet';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  danger?: boolean;
  badge?: string;
  disabled?: boolean;
}

function SettingRow({ icon, label, description, onClick, danger, badge, disabled }: SettingRowProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '15px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, box-shadow 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'inset 4px 0 0 rgba(255,255,255,0.4)';
      } }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: danger ? 'rgba(244,63,94,0.12)' : 'var(--bg-elevated)',
        border: `1.5px solid ${danger ? 'rgba(244,63,94,0.25)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? 'var(--red)' : 'var(--text-secondary)',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: danger ? 'var(--red)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {label}
          {badge && (
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px',
              background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <ChevronRight size={16} color="var(--text-muted)" />
    </button>
  );
}

export default function SettingsPage() {
  const { ready, authenticated, logout, exportWallet, user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const address = getActiveWalletAddress(wallets) ?? '';

  const loginEmail = user?.linkedAccounts?.find(a => a.type === 'email')?.address
    ?? user?.linkedAccounts?.find(a => a.type === 'google_oauth')?.email
    ?? '';

  useEffect(() => {
    if (ready && !authenticated) router.replace('/');
  }, [ready, authenticated, router]);

  async function handleCopyAddress() {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleExportKey() {
    if (!exportWallet) return;
    setExportLoading(true);
    try {
      await exportWallet();
    } catch (e) {
      console.error('[exportWallet]', e);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', display: 'flex' }}>
            <ArrowLeft size={22} />
          </Link>
          <h1 className="page-title">Account</h1>
        </div>

        {/* ── Wallet identity card ──────────────────────────────── */}
        <div className="card animate-fade-in-up" style={{ padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: 'linear-gradient(135deg, #222 0%, #0a0a0a 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}>
              <Wallet size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Active Wallet
              </div>
              {loginEmail && (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {loginEmail}
                </div>
              )}
            </div>
          </div>

          {/* Address display */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Wallet Address
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--text-secondary)', wordBreak: 'break-all', lineHeight: 1.6 }}>
              {address || '—'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={handleCopyAddress}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 8,
                  background: copied ? 'rgba(255,255,255,0.1)' : 'var(--bg-base)',
                  border: `1px solid ${copied ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
                  color: copied ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {address && (
                <a
                  href={`https://explore.tempo.xyz/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8,
                    background: 'var(--bg-base)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
                    (e.currentTarget as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  }}
                >
                  <ExternalLink size={13} />
                  Explorer
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Security & auth ──────────────────────────────────── */}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '16px 4px 8px' }}>
          Security
        </div>
        <div className="card animate-fade-in-up" style={{ overflow: 'hidden', padding: 0, marginBottom: 16 }}>

          {/* Web3 login status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '15px 16px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: embeddedWallet ? 'rgba(255,255,255,0.08)' : 'var(--bg-elevated)',
              border: `1.5px solid ${address ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: address ? '#ffffff' : 'var(--text-secondary)',
              flexShrink: 0,
            }}>
              <Wallet size={17} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                Web3 Wallet Login
                <span style={{
                  fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px',
                  background: address ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  color: address ? '#ffffff' : 'var(--text-muted)',
                  border: `1px solid ${address ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 99, letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  {address ? 'Active' : 'Not set'}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {address
                  ? 'Sign in and transactions are handled via your Privy wallet session'
                  : 'Connect a wallet to activate Web3 login'}
              </div>
            </div>
          </div>

          <SettingRow
            icon={<Key size={16} />}
            label="Export Private Key"
            description={exportLoading ? 'Opening secure modal…' : 'Privy opens a secure, isolated modal — only you see the key'}
            badge="Secure"
            onClick={handleExportKey}
            disabled={!embeddedWallet || exportLoading}
          />

          <SettingRow
            icon={<Shield size={16} />}
            label="Manage Linked Accounts"
            description="Manage linked login methods from your ReTempo account page"
            onClick={() => router.push('/settings/linked-accounts')}
          />
        </div>

        {/* ── Network info ─────────────────────────────────────── */}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 4px 8px' }}>
          Network
        </div>
        <div className="card animate-fade-in-up" style={{ padding: '14px 16px', marginBottom: 16 }}>
          {[
            { label: 'Network',    value: 'Tempo Moderato Testnet',           mono: false },
            { label: 'Chain ID',   value: '42431',                            mono: true  },
            { label: 'RPC',        value: 'rpc.moderato.tempo.xyz',          mono: true  },
            { label: 'Router Fee', value: '0.20%',                           mono: false },
            { label: 'Pool Fee',   value: '0.30%',                           mono: false },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', textShadow: '0 0 8px rgba(255,255,255,0.2)', fontWeight: 600, fontFamily: row.mono ? 'monospace' : 'inherit' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Sign out ─────────────────────────────────────────── */}
        <div className="card animate-fade-in-up" style={{ overflow: 'hidden', padding: 0, marginBottom: 16 }}>
          <SettingRow
            icon={<LogOut size={16} />}
            label="Sign Out"
            description="Log out of your wallet session"
            onClick={handleLogout}
            danger
          />
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 8, paddingBottom: 16 }}>
          ReTempo · Tempo Blockchain
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
