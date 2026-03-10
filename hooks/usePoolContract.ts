'use client';

import { useMemo, useState } from 'react';
import { parseUnits } from 'viem';
import { usePublicClient, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { ERC20_ABI, tempoChain } from '@/lib/config';
import { POOL_ABI } from '@/lib/contracts';

type AddStep = 'approving-a' | 'approving-b' | 'adding';

interface AddLiquidityParams {
  tokenAAddress: `0x${string}`;
  tokenBAddress: `0x${string}`;
  amountA: string;
  amountB: string;
  decimalsA?: number;
  decimalsB?: number;
  onStepChange?: (step: AddStep) => void;
}

function parseErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (raw.includes('user rejected')) return 'Transaction rejected by user.';
  if (raw.includes('insufficient')) return 'Insufficient balance or allowance.';
  if (raw.includes('execution reverted')) return 'Transaction reverted by contract. Check amount and ratio.';
  return raw.slice(0, 180);
}

export function useAddLiquidity(poolAddress?: `0x${string}`) {
  const [finalHash, setFinalHash] = useState<`0x${string}` | undefined>();
  const [isFlowPending, setIsFlowPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const publicClient = usePublicClient();
  const { writeContractAsync, reset: resetWrite, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: finalHash });

  async function addLiquidity(params: AddLiquidityParams) {
    if (!poolAddress) throw new Error('Pool address is not available.');

    const decimalsA = params.decimalsA ?? 6;
    const decimalsB = params.decimalsB ?? 6;
    const amountA = parseUnits(params.amountA, decimalsA);
    const amountB = parseUnits(params.amountB, decimalsB);

    setLocalError(null);
    setIsFlowPending(true);

    try {
      params.onStepChange?.('approving-a');
      const approveAHash = await writeContractAsync({
        address: params.tokenAAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress, amountA],
        chainId: tempoChain.id,
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveAHash });
      }

      params.onStepChange?.('approving-b');
      const approveBHash = await writeContractAsync({
        address: params.tokenBAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress, amountB],
        chainId: tempoChain.id,
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveBHash });
      }

      params.onStepChange?.('adding');
      const hash = await writeContractAsync({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'addLiquidity',
        args: [amountA, amountB],
        chainId: tempoChain.id,
      });
      setFinalHash(hash);
      return hash;
    } catch (err) {
      const msg = parseErrorMessage(err);
      setLocalError(msg);
      throw new Error(msg);
    } finally {
      setIsFlowPending(false);
    }
  }

  function reset() {
    setFinalHash(undefined);
    setIsFlowPending(false);
    setLocalError(null);
    resetWrite();
  }

  return {
    addLiquidity,
    hash: finalHash,
    isPending: isFlowPending,
    isConfirming,
    isSuccess,
    error: localError ?? (error ? parseErrorMessage(error) : null),
    reset,
  };
}

export function useRemoveLiquidity(poolAddress?: `0x${string}`) {
  const [finalHash, setFinalHash] = useState<`0x${string}` | undefined>();
  const [isFlowPending, setIsFlowPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { writeContractAsync, reset: resetWrite, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: finalHash });

  async function removeLiquidity(shares: string, decimals = 6) {
    if (!poolAddress) throw new Error('Pool address is not available.');
    setLocalError(null);
    setIsFlowPending(true);

    try {
      const sharesBn = parseUnits(shares, decimals);
      const hash = await writeContractAsync({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: 'removeLiquidity',
        args: [sharesBn],
        chainId: tempoChain.id,
      });
      setFinalHash(hash);
      return hash;
    } catch (err) {
      const msg = parseErrorMessage(err);
      setLocalError(msg);
      throw new Error(msg);
    } finally {
      setIsFlowPending(false);
    }
  }

  function reset() {
    setFinalHash(undefined);
    setIsFlowPending(false);
    setLocalError(null);
    resetWrite();
  }

  return {
    removeLiquidity,
    hash: finalHash,
    isPending: isFlowPending,
    isConfirming,
    isSuccess,
    error: localError ?? (error ? parseErrorMessage(error) : null),
    reset,
  };
}

function getResultValue<T>(result: { status: string; result?: unknown } | undefined, fallback: T): T {
  if (!result || result.status !== 'success') return fallback;
  return result.result as T;
}

export function usePoolInfo(poolAddress?: `0x${string}`, userAddress?: `0x${string}`) {
  const account = userAddress ?? '0x0000000000000000000000000000000000000000';

  const contracts = useMemo(
    () =>
      poolAddress
        ? ([
            {
              address: poolAddress,
              abi: POOL_ABI,
              functionName: 'getReserves' as const,
              chainId: tempoChain.id,
            },
            {
              address: poolAddress,
              abi: POOL_ABI,
              functionName: 'liquidity' as const,
              args: [account] as [`0x${string}`],
              chainId: tempoChain.id,
            },
            {
              address: poolAddress,
              abi: POOL_ABI,
              functionName: 'tokenA' as const,
              chainId: tempoChain.id,
            },
            {
              address: poolAddress,
              abi: POOL_ABI,
              functionName: 'tokenB' as const,
              chainId: tempoChain.id,
            },
            {
              address: poolAddress,
              abi: POOL_ABI,
              functionName: 'totalSupply' as const,
              chainId: tempoChain.id,
            },
          ] as const)
        : undefined,
    [poolAddress, account],
  );

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!poolAddress,
      refetchInterval: 8_000,
      refetchOnWindowFocus: true,
      staleTime: 4_000,
    },
  });

  const reserves = getResultValue<readonly [bigint, bigint] | undefined>(data?.[0], undefined);
  const reserveA = reserves?.[0] ?? BigInt(0);
  const reserveB = reserves?.[1] ?? BigInt(0);

  const userShares = getResultValue<bigint>(data?.[1], BigInt(0));
  const tokenAAddress = getResultValue<`0x${string}` | undefined>(data?.[2], undefined);
  const tokenBAddress = getResultValue<`0x${string}` | undefined>(data?.[3], undefined);
  const totalShares = getResultValue<bigint>(data?.[4], BigInt(0));

  return {
    reserveA,
    reserveB,
    userShares,
    tokenAAddress,
    tokenBAddress,
    totalShares,
    isLoading,
    refetch,
  };
}
