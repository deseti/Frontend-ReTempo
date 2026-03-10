'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatUnits, parseUnits } from 'viem';
import { usePrivy } from '@privy-io/react-auth';
import { AlertCircle, ArrowLeft, CheckCircle, Droplets } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useAddLiquidity, usePoolInfo, useRemoveLiquidity } from '@/hooks/usePoolContract';
import { SUPPORTED_TOKENS, getPoolAddress } from '@/lib/config';

type AddStep = 'idle' | 'approving-a' | 'approving-b' | 'adding' | 'success' | 'error';
type RemoveStep = 'idle' | 'removing' | 'success' | 'error';

const DECIMALS = 6;

function formatAmount(value: bigint, decimals = DECIMALS, max = 4): string {
  const num = Number(formatUnits(value, decimals));
  if (!Number.isFinite(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: max,
  });
}

export default function PoolPage() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const { balances, address, refetch: refetchBalances } = useTokenBalances();
  const [tab, setTab] = useState<'add' | 'remove'>('add');
  const [errMsg, setErrMsg] = useState('');

  const hubToken = useMemo(() => SUPPORTED_TOKENS.find((token) => token.isHub), []);
  const quoteTokens = useMemo(
    () => SUPPORTED_TOKENS.filter((token) => !token.isHub),
    [],
  );

  const [quoteAddress, setQuoteAddress] = useState<`0x${string}` | undefined>(quoteTokens[0]?.address);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [sharesInput, setSharesInput] = useState('');
  const [addStep, setAddStep] = useState<AddStep>('idle');
  const [removeStep, setRemoveStep] = useState<RemoveStep>('idle');
  const [addSnapshot, setAddSnapshot] = useState<bigint>(BigInt(0));
  const [sharesAdded, setSharesAdded] = useState<bigint>(BigInt(0));
  const [removeEstimateA, setRemoveEstimateA] = useState<bigint>(BigInt(0));
  const [removeEstimateB, setRemoveEstimateB] = useState<bigint>(BigInt(0));

  useEffect(() => {
    if (ready && !authenticated) router.replace('/');
  }, [ready, authenticated, router]);

  const tokenA = hubToken;
  const tokenB = useMemo(
    () => quoteTokens.find((token) => token.address === quoteAddress),
    [quoteAddress, quoteTokens],
  );

  const poolAddress = useMemo(() => {
    if (!tokenA || !tokenB) return undefined;
    return getPoolAddress(tokenA.address, tokenB.address);
  }, [tokenA, tokenB]);

  const {
    reserveA,
    reserveB,
    userShares,
    tokenAAddress,
    tokenBAddress,
    totalShares,
    isLoading: isPoolLoading,
    refetch: refetchPool,
  } = usePoolInfo(poolAddress, address);

  const {
    addLiquidity,
    isPending: isAddPending,
    isConfirming: isAddConfirming,
    isSuccess: isAddSuccess,
    error: addError,
    reset: resetAdd,
  } = useAddLiquidity(poolAddress);

  const {
    removeLiquidity,
    isPending: isRemovePending,
    isConfirming: isRemoveConfirming,
    isSuccess: isRemoveSuccess,
    error: removeError,
    reset: resetRemove,
  } = useRemoveLiquidity(poolAddress);

  const resolvedTokenA = useMemo(
    () => SUPPORTED_TOKENS.find((token) => token.address.toLowerCase() === (tokenAAddress ?? tokenA?.address ?? '').toLowerCase()) ?? tokenA,
    [tokenAAddress, tokenA],
  );
  const resolvedTokenB = useMemo(
    () => SUPPORTED_TOKENS.find((token) => token.address.toLowerCase() === (tokenBAddress ?? tokenB?.address ?? '').toLowerCase()) ?? tokenB,
    [tokenBAddress, tokenB],
  );

  const balanceA = balances.find((balance) => balance.address === resolvedTokenA?.address);
  const balanceB = balances.find((balance) => balance.address === resolvedTokenB?.address);

  const estimatedOutA = useMemo(() => {
    if (!sharesInput || totalShares <= BigInt(0) || reserveA <= BigInt(0)) return BigInt(0);
    try {
      const sharesBn = parseUnits(sharesInput, DECIMALS);
      return (sharesBn * reserveA) / totalShares;
    } catch {
      return BigInt(0);
    }
  }, [sharesInput, totalShares, reserveA]);

  const estimatedOutB = useMemo(() => {
    if (!sharesInput || totalShares <= BigInt(0) || reserveB <= BigInt(0)) return BigInt(0);
    try {
      const sharesBn = parseUnits(sharesInput, DECIMALS);
      return (sharesBn * reserveB) / totalShares;
    } catch {
      return BigInt(0);
    }
  }, [sharesInput, totalShares, reserveB]);

  useEffect(() => {
    if (isAddSuccess && addStep === 'adding') {
      setAddStep('success');
      void refetchPool();
      void refetchBalances();
    }
  }, [isAddSuccess, addStep, refetchPool, refetchBalances]);

  useEffect(() => {
    if (isRemoveSuccess && removeStep === 'removing') {
      setRemoveStep('success');
      void refetchPool();
      void refetchBalances();
    }
  }, [isRemoveSuccess, removeStep, refetchPool, refetchBalances]);

  useEffect(() => {
    if (addStep === 'success' && userShares >= addSnapshot) {
      setSharesAdded(userShares - addSnapshot);
    }
  }, [addStep, userShares, addSnapshot]);

  async function handleAddLiquidity() {
    if (!resolvedTokenA || !resolvedTokenB || !amountA || !amountB) return;
    setErrMsg('');
    setSharesAdded(BigInt(0));
    setAddSnapshot(userShares);

    try {
      await addLiquidity({
        tokenAAddress: resolvedTokenA.address,
        tokenBAddress: resolvedTokenB.address,
        amountA,
        amountB,
        decimalsA: DECIMALS,
        decimalsB: DECIMALS,
        onStepChange: (nextStep) => setAddStep(nextStep),
      });
      setAddStep('adding');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrMsg(message);
      setAddStep('error');
    }
  }

  async function handleRemoveLiquidity() {
    if (!sharesInput) return;
    setErrMsg('');

    try {
      const sharesBn = parseUnits(sharesInput, DECIMALS);
      if (totalShares > BigInt(0)) {
        setRemoveEstimateA((sharesBn * reserveA) / totalShares);
        setRemoveEstimateB((sharesBn * reserveB) / totalShares);
      }
      setRemoveStep('removing');
      await removeLiquidity(sharesInput, DECIMALS);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrMsg(message);
      setRemoveStep('error');
    }
  }

  function resetAddState() {
    setAddStep('idle');
    setAmountA('');
    setAmountB('');
    setErrMsg('');
    setSharesAdded(BigInt(0));
    resetAdd();
  }

  function resetRemoveState() {
    setRemoveStep('idle');
    setSharesInput('');
    setErrMsg('');
    setRemoveEstimateA(BigInt(0));
    setRemoveEstimateB(BigInt(0));
    resetRemove();
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <Link href="/dashboard" style={{ color: 'var(--text-muted)', display: 'flex' }}>
            <ArrowLeft size={22} />
          </Link>
          <h1 className="page-title">Liquidity Pool</h1>
        </div>

        <div className="card animate-fade-in-up" style={{ padding: 24, marginTop: 8 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
              Pool
            </label>
            <select
              className="input select"
              value={quoteAddress}
              onChange={(event) => {
                setQuoteAddress(event.target.value as `0x${string}`);
                resetAddState();
                resetRemoveState();
              }}
            >
              {quoteTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {hubToken?.symbol} / {token.symbol}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setTab('add')}
              className="input"
              style={{
                height: 44,
                background: tab === 'add' ? 'var(--bg-elevated)' : 'transparent',
                borderColor: tab === 'add' ? 'var(--accent)' : 'var(--border)',
                color: tab === 'add' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
              }}
            >
              Add Liquidity
            </button>
            <button
              type="button"
              onClick={() => setTab('remove')}
              className="input"
              style={{
                height: 44,
                background: tab === 'remove' ? 'var(--bg-elevated)' : 'transparent',
                borderColor: tab === 'remove' ? 'var(--accent)' : 'var(--border)',
                color: tab === 'remove' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
              }}
            >
              Remove Liquidity
            </button>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              marginBottom: 18,
              fontSize: '0.8rem',
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>
              Pool: {resolvedTokenA?.symbol} / {resolvedTokenB?.symbol}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              Reserves: {isPoolLoading ? 'Loading...' : `${formatAmount(reserveA)} ${resolvedTokenA?.symbol} | ${formatAmount(reserveB)} ${resolvedTokenB?.symbol}`}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
              Total shares: {isPoolLoading ? 'Loading...' : formatAmount(totalShares)}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Your shares: {isPoolLoading ? 'Loading...' : formatAmount(userShares)}
            </div>
          </div>

          {tab === 'add' ? (
            <>
              {addStep === 'success' ? (
                <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                  <CheckCircle size={52} color="var(--accent)" style={{ margin: '0 auto 16px', display: 'block' }} />
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Liquidity Added!
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
                    Received ~{formatAmount(sharesAdded)} LP shares
                  </div>
                  <button className="btn btn-primary" onClick={resetAddState} style={{ width: '100%' }}>
                    Add Again
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                      Amount {resolvedTokenA?.symbol}
                    </label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={amountA}
                      onChange={(event) => setAmountA(event.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        Balance: {balanceA?.balance ?? '0.00'} {resolvedTokenA?.symbol}
                      </span>
                      <button
                        onClick={() => setAmountA(balanceA ? formatUnits(balanceA.balanceRaw, DECIMALS) : '0')}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.73rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                      Amount {resolvedTokenB?.symbol}
                    </label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={amountB}
                      onChange={(event) => setAmountB(event.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        Balance: {balanceB?.balance ?? '0.00'} {resolvedTokenB?.symbol}
                      </span>
                      <button
                        onClick={() => setAmountB(balanceB ? formatUnits(balanceB.balanceRaw, DECIMALS) : '0')}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.73rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {addStep === 'error' && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16, color: 'var(--red)', fontSize: '0.8rem' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      {errMsg || addError || 'Failed to add liquidity. Please try again.'}
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={handleAddLiquidity}
                    disabled={!amountA || !amountB || !poolAddress || isAddPending || isAddConfirming}
                    style={{ width: '100%' }}
                  >
                    {addStep === 'approving-a' ? (
                      <><div className="spinner" />Approving {resolvedTokenA?.symbol}...</>
                    ) : addStep === 'approving-b' ? (
                      <><div className="spinner" />Approving {resolvedTokenB?.symbol}...</>
                    ) : addStep === 'adding' || isAddConfirming ? (
                      <><div className="spinner" />Adding...</>
                    ) : (
                      <><Droplets size={16} />Add Liquidity</>
                    )}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {removeStep === 'success' ? (
                <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                  <CheckCircle size={52} color="var(--accent)" style={{ margin: '0 auto 16px', display: 'block' }} />
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Liquidity Removed!
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
                    Estimated received: {formatAmount(removeEstimateA)} {resolvedTokenA?.symbol} + {formatAmount(removeEstimateB)} {resolvedTokenB?.symbol}
                  </div>
                  <button className="btn btn-primary" onClick={resetRemoveState} style={{ width: '100%' }}>
                    Remove Again
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Available shares: {formatAmount(userShares)}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                      Shares to remove
                    </label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={sharesInput}
                      onChange={(event) => setSharesInput(event.target.value)}
                    />
                    <button
                      onClick={() => setSharesInput(formatUnits(userShares, DECIMALS))}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', marginTop: 6, padding: 0, textDecoration: 'underline' }}
                    >
                      Max
                    </button>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      marginBottom: 20,
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Estimated receive: {formatAmount(estimatedOutA)} {resolvedTokenA?.symbol} + {formatAmount(estimatedOutB)} {resolvedTokenB?.symbol}
                  </div>

                  {removeStep === 'error' && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16, color: 'var(--red)', fontSize: '0.8rem' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      {errMsg || removeError || 'Failed to remove liquidity. Please try again.'}
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={handleRemoveLiquidity}
                    disabled={!sharesInput || !poolAddress || isRemovePending || isRemoveConfirming}
                    style={{ width: '100%' }}
                  >
                    {removeStep === 'removing' || isRemoveConfirming ? (
                      <><div className="spinner" />Removing...</>
                    ) : (
                      <><Droplets size={16} />Remove Liquidity</>
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
