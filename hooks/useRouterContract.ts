'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ROUTER_ABI } from '@/lib/contracts';
import { ROUTER_ADDRESS, ERC20_ABI } from '@/lib/config';

// ─── routeSwap ────────────────────────────────────────────────────────────────
export function useRouteSwap() {
  const { data: hash, writeContractAsync, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function routeSwap(
    tokenIn:  `0x${string}`,
    tokenOut: `0x${string}`,
    amountIn: string,
    decimals: number = 6,
    // slippageBps REMOVED — kontrak on-chain tidak support minAmountOut
  ) {
    const amount = parseUnits(amountIn, decimals);

    // Step 1: approve router to spend tokenIn
    await writeContractAsync({
      address: tokenIn,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, amount],
    });

    // Step 2: call routeSwap — 3 params only (tokenIn, tokenOut, amountIn)
    const txHash = await writeContractAsync({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: 'routeSwap',
      args: [tokenIn, tokenOut, amount],
    });

    return txHash;
  }

  return { routeSwap, hash, isPending, isConfirming, isSuccess, error, reset };
}

// ─── payInvoice ───────────────────────────────────────────────────────────────
export function usePayInvoice() {
  const { data: hash, writeContractAsync, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function payInvoice(
    invoiceId: bigint,
    paymentTokenAddress: `0x${string}`,
    approvalAmount: bigint
  ) {
    // Step 1: approve
    await writeContractAsync({
      address: paymentTokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, approvalAmount],
    });

    // Step 2: pay
    const txHash = await writeContractAsync({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: 'payInvoice',
      args: [invoiceId, paymentTokenAddress],
    });

    return txHash;
  }

  return { payInvoice, hash, isPending, isConfirming, isSuccess, error, reset };
}

// ─── createInvoice ────────────────────────────────────────────────────────────
export function useCreateInvoice() {
  const { data: hash, writeContractAsync, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function createInvoice(tokenAddress: `0x${string}`, amount: string, decimals = 6) {
    const amountBn = parseUnits(amount, decimals);
    const txHash = await writeContractAsync({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: 'createInvoice',
      args: [tokenAddress, amountBn],
    });
    return txHash;
  }

  return { createInvoice, hash, isPending, isConfirming, isSuccess, error, reset };
}