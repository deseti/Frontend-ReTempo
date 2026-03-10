'use client';

import { useReadContracts } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { formatUnits } from 'viem';
import { SUPPORTED_TOKENS, ERC20_ABI, tempoChain } from '@/lib/config';
import { getActiveWalletAddress } from '@/lib/wallet';

export interface TokenBalance {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  color: string;
  isHub?: boolean;
  balance: string;
  balanceRaw: bigint;
  isLoading: boolean;
}

export function useTokenBalances() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const address = getActiveWalletAddress(wallets);

  const contracts = SUPPORTED_TOKENS.map(token => ({
    address: token.address,
    abi: ERC20_ABI,
    chainId: tempoChain.id,          // ← FIX: pastikan baca dari Tempo chain
    functionName: 'balanceOf' as const,
    args: [address ?? '0x0000000000000000000000000000000000000000'] as [`0x${string}`],
  }));

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: authenticated && !!address,
      refetchInterval: 8_000,        // ← FIX: lebih cepat dari 15s → 8s
      refetchOnMount: true,
      refetchOnWindowFocus: true,    // ← FIX: refresh saat window kembali aktif
      staleTime: 4_000,
    },
  });

  const balances: TokenBalance[] = SUPPORTED_TOKENS.map((token, i) => {
    const result = data?.[i];
    const raw = result?.status === 'success' ? (result.result as bigint) : BigInt(0);
    return {
      ...token,
      balanceRaw: raw,
      balance: raw > BigInt(0)
        ? parseFloat(formatUnits(raw, token.decimals)).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })
        : '0.00',
      isLoading,
    };
  });

  return { balances, isLoading, refetch, address };
}
