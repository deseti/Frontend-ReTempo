'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { AlertCircle, ArrowLeft, CheckCircle2, Link2, Mail, Shield, Wallet } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

type LinkedAccount = {
  type: string;
  address?: string;
  email?: string;
  subject?: string;
};

function getAccountLabel(account: LinkedAccount): string {
  if (account.type === 'email') return account.email ?? 'Email account';
  if (account.type === 'google_oauth') return account.email ?? 'Google account';
  if (account.type === 'wallet') return account.address ?? 'Wallet account';
  if (account.type === 'passkey') return 'Passkey';
  return account.type;
}

export default function LinkedAccountsPage() {
  const {
    ready,
    authenticated,
    user,
    linkEmail,
    linkGoogle,
    linkWallet,
    unlinkEmail,
    unlinkGoogle,
    unlinkWallet,
  } = usePrivy();
  const router = useRouter();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !authenticated) router.replace('/');
  }, [ready, authenticated, router]);

  const linkedAccounts = (user?.linkedAccounts ?? []) as LinkedAccount[];
  const canUnlink = linkedAccounts.length > 1;

  async function handleUnlink(account: LinkedAccount, index: number) {
    const key = `${account.type}-${index}`;
    setBusyKey(key);
    setError('');
    setSuccess('');

    try {
      if (account.type === 'email' && account.email) {
        await unlinkEmail(account.email);
      } else if (account.type === 'google_oauth' && account.subject) {
        await unlinkGoogle(account.subject);
      } else if (account.type === 'wallet' && account.address) {
        await unlinkWallet(account.address);
      } else {
        throw new Error('This account type cannot be removed here.');
      }
      setSuccess('Account unlinked successfully.');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message.slice(0, 140));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <Link href="/settings" style={{ color: 'var(--text-muted)', display: 'flex' }}>
            <ArrowLeft size={22} />
          </Link>
          <h1 className="page-title">Manage Linked Accounts</h1>
        </div>

        <div className="card animate-fade-in-up" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Link additional login methods to your ReTempo account.
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={linkWallet}>
              <Wallet size={16} />
              Link Wallet (Web3)
            </button>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={linkEmail}>
              <Mail size={16} />
              Link Email
            </button>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={linkGoogle}>
              <Shield size={16} />
              Link Google
            </button>
          </div>
        </div>

        <div className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Linked Accounts
          </div>

          {linkedAccounts.length === 0 ? (
            <div style={{ padding: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No linked accounts found.
            </div>
          ) : (
            linkedAccounts.map((account, index) => {
              const key = `${account.type}-${index}`;
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderBottom: index === linkedAccounts.length - 1 ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {account.type === 'google_oauth' ? 'Google' : account.type === 'wallet' ? 'Wallet' : account.type === 'email' ? 'Email' : account.type}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2, wordBreak: 'break-all' }}>
                      {getAccountLabel(account)}
                    </div>
                  </div>

                  <button
                    className="btn btn-ghost"
                    style={{ padding: '8px 12px', minHeight: 34 }}
                    disabled={!canUnlink || busyKey === key}
                    onClick={() => handleUnlink(account, index)}
                    title={canUnlink ? 'Unlink this account' : 'At least one account must remain linked'}
                  >
                    {busyKey === key ? <div className="spinner" /> : <><Link2 size={14} />Unlink</>}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {(error || success) && (
          <div
            className="card animate-fade-in-up"
            style={{
              marginTop: 14,
              padding: 12,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              color: error ? 'var(--red)' : 'var(--accent)',
              fontSize: '0.8rem',
            }}
          >
            {error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {error || success}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
