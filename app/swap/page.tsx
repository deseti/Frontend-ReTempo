'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { TokenIcon } from '@/components/ui/TokenIcon';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { SUPPORTED_TOKENS, ERC20_ABI, ROUTER_ADDRESS } from '@/lib/config';
import { ROUTER_ABI } from '@/lib/contracts';
import { ArrowLeft, ArrowLeftRight, CheckCircle, AlertCircle, ArrowDown } from 'lucide-react';
import Link from 'next/link';

export default function SwapPage() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const { balances } = useTokenBalances();

  const [tokenIn, setTokenIn] = useState(SUPPORTED_TOKENS[1].address); // βUSD
  const [tokenOut, setTokenOut] = useState(SUPPORTED_TOKENS[0].address); // αUSD (hub)
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'idle' | 'approving' | 'swapping' | 'success' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (ready && !authenticated) router.replace('/');
  }, [ready, authenticated, router]);

  const tIn  = SUPPORTED_TOKENS.find(t => t.address === tokenIn)!;
  const tOut = SUPPORTED_TOKENS.find(t => t.address === tokenOut)!;
  const balIn = balances.find(b => b.address === tokenIn);

  function switchTokens() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmount('');
  }

  async function handleSwap() {
    if (!amount || !tIn || !tOut || tokenIn === tokenOut) return;
    setErrMsg('');
    try {
      const amountBn = parseUnits(amount, tIn.decimals);

      setStep('approving');
      const approveHash = await writeContractAsync({
        address: tIn.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ROUTER_ADDRESS, amountBn],
      });
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      setStep('swapping');
      const hash = await writeContractAsync({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'routeSwap',
        args: [tIn.address, tOut.address, amountBn], // ← 3 params only, minAmountOut removed
      });
      setTxHash(hash);
      setStep('success');
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      const msg = raw.includes('user rejected') ? 'Transaction rejected by user.'
        : raw.includes('insufficient') ? 'Insufficient balance or allowance.'
        : raw.includes('slippage') || raw.includes('INSUFFICIENT_OUTPUT') ? 'Slippage too high — try a smaller amount.'
        : raw.slice(0, 120);
      setErrMsg(msg);
      setStep('error');
    }
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', display: 'flex' }}>
            <ArrowLeft size={22} />
          </Link>
          <h1 className="page-title">Swap Tokens</h1>
        </div>

        {step === 'success' ? (
          <div className="card animate-fade-in-up" style={{ padding: '40px 24px', textAlign: 'center', marginTop: 20 }}>
            <CheckCircle size={52} color="var(--accent)" style={{ margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Swap Complete!
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
              {amount} {tIn.symbol} → {tOut.symbol}
            </div>
            {txHash && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 24, wordBreak: 'break-all' }}>Tx: {txHash}</div>}
            <button className="btn btn-primary" onClick={() => { setStep('idle'); setAmount(''); }} style={{ width: '100%' }}>
              Swap Again
            </button>
          </div>
        ) : (
          <div className="card animate-fade-in-up" style={{ padding: '24px', marginTop: 8 }}>
            {/* From token */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                From
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  id="swap-from-select"
                  className="input select"
                  value={tokenIn}
                  onChange={e => setTokenIn(e.target.value as `0x${string}`)}
                  style={{ flex: 1 }}
                >
                  {SUPPORTED_TOKENS.map(t => (
                    <option key={t.address} value={t.address}>{t.symbol}</option>
                  ))}
                </select>
                <input
                  id="swap-amount-input"
                  className="input"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ flex: 1.5 }}
                />
              </div>
              {balIn && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                    Balance: {balIn.balance} {tIn.symbol}
                  </span>
                  <button onClick={() => setAmount(formatUnits(balIn.balanceRaw, tIn.decimals))} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.73rem', cursor: 'pointer', padding: 0 }}>
                    Max
                  </button>
                </div>
              )}
            </div>

            {/* Switch button */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
              <button
                onClick={switchTokens}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--bg-elevated)', border: '1.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
              >
                <ArrowDown size={18} color="var(--text-muted)" />
              </button>
            </div>

            {/* To token */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                To
              </label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  id="swap-to-select"
                  className="input select"
                  value={tokenOut}
                  onChange={e => setTokenOut(e.target.value as `0x${string}`)}
                  style={{ flex: 1 }}
                >
                  {SUPPORTED_TOKENS.filter(t => t.address !== tokenIn).map(t => (
                    <option key={t.address} value={t.address}>{t.symbol}</option>
                  ))}
                </select>
                <div style={{
                  flex: 1.5, padding: '14px 16px', background: 'var(--bg-elevated)',
                  border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)', fontSize: '0.88rem',
                }}>
                  ~ auto-quoted
                </div>
              </div>
            </div>

            {/* Route info */}
            <div style={{
              background: 'rgba(16,185,129,0.06)', border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20,
              fontSize: '0.78rem', color: 'var(--text-secondary)',
            }}>
              ⚡ Router finds best path: direct pool or 2-hop via AlphaUSD hub. No manual routing needed.
            </div>

            {step === 'error' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16, color: 'var(--red)', fontSize: '0.8rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {errMsg || 'Swap failed. Check route or try a smaller amount.'}
              </div>
            )}

            <button
              id="swap-btn"
              className="btn btn-primary"
              onClick={handleSwap}
              disabled={!amount || tokenIn === tokenOut || step === 'approving' || step === 'swapping' || isConfirming}
              style={{ width: '100%' }}
            >
              {step === 'approving' ? (
                <><div className="spinner" />Approving…</>
              ) : step === 'swapping' || isConfirming ? (
                <><div className="spinner" />Swapping…</>
              ) : (
                <><ArrowLeftRight size={16} />Swap</>
              )}
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}