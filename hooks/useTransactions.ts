'use client';

import { useWallets } from '@privy-io/react-auth';
import { usePublicClient } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';
import { ROUTER_ADDRESS, SUPPORTED_TOKENS, tempoChain } from '@/lib/config';
import { formatUnits } from 'viem';
import { getActiveWalletAddress } from '@/lib/wallet';

export type TxType = 'swap' | 'send' | 'receive' | 'invoice_paid' | 'invoice_created';

export interface Transaction {
  id: string;
  type: TxType;
  txHash: `0x${string}`;
  blockNumber: bigint;
  timestamp?: number;
  // Swap fields
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  // Send/Receive fields
  from?: string;
  to?: string;
  amount?: string;
  tokenSymbol?: string;
}

const MAX_BLOCKS = BigInt(10_000);

function getTokenSymbol(addr: string): string {
  const t = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === addr.toLowerCase());
  return t?.symbol ?? addr.slice(0, 6) + '…';
}

export function useTransactions() {
  const { wallets } = useWallets();
  const publicClient = usePublicClient({ chainId: tempoChain.id });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const address = getActiveWalletAddress(wallets);

  const fetchTxs = useCallback(async () => {
    if (!address || !publicClient || ROUTER_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return;
    }
    setIsLoading(true);
    try {
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > MAX_BLOCKS ? latestBlock - MAX_BLOCKS : BigInt(0);

      // Fetch SwapRouted events
      const swapLogs = await publicClient.getLogs({
        address: ROUTER_ADDRESS,
        event: {
          name: 'SwapRouted',
          type: 'event',
          inputs: [
            { name: 'sender',   type: 'address', indexed: true },
            { name: 'tokenIn',  type: 'address', indexed: true },
            { name: 'tokenOut', type: 'address', indexed: true },
            { name: 'amountIn',  type: 'uint256', indexed: false },
            { name: 'amountOut', type: 'uint256', indexed: false },
          ],
        },
        args: { sender: address },
        fromBlock,
        toBlock: latestBlock,
      }).catch(() => []);

      // Fetch InvoicePaid events
      const paidLogs = await publicClient.getLogs({
        address: ROUTER_ADDRESS,
        event: {
          name: 'InvoicePaid',
          type: 'event',
          inputs: [
            { name: 'invoiceId',    type: 'uint256', indexed: true },
            { name: 'payer',        type: 'address', indexed: true },
            { name: 'paymentToken', type: 'address', indexed: false },
            { name: 'amountPaid',   type: 'uint256', indexed: false },
          ],
        },
        args: { payer: address },
        fromBlock,
        toBlock: latestBlock,
      }).catch(() => []);

      // Fetch ERC-20 Transfer events (Outgoing / Send)
      const tokenAddresses = SUPPORTED_TOKENS.map(t => t.address);
      const transferEventAbi = {
        name: 'Transfer',
        type: 'event',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false },
        ],
      } as const;

      const sendLogs = await publicClient.getLogs({
        address: tokenAddresses,
        event: transferEventAbi,
        args: { from: address },
        fromBlock,
        toBlock: latestBlock,
      }).catch(() => []);

      // Fetch ERC-20 Transfer events (Incoming / Receive)
      const receiveLogs = await publicClient.getLogs({
        address: tokenAddresses,
        event: transferEventAbi,
        args: { to: address },
        fromBlock,
        toBlock: latestBlock,
      }).catch(() => []);

      const swapTxs: Transaction[] = swapLogs.map(log => {
        const args = log.args as {
          tokenIn?: `0x${string}`;
          tokenOut?: `0x${string}`;
          amountIn?: bigint;
          amountOut?: bigint;
        };
        const tInAddr = args.tokenIn?.toLowerCase() ?? '';
        const tOutAddr = args.tokenOut?.toLowerCase() ?? '';
        const tokenInDecimals = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tInAddr)?.decimals ?? 6;
        const tokenOutDecimals = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tOutAddr)?.decimals ?? 6;
        return {
          id: `swap-${log.transactionHash}-${log.logIndex}`,
          type: 'swap',
          txHash: log.transactionHash!,
          blockNumber: log.blockNumber ?? BigInt(0),
          tokenIn:   getTokenSymbol(tInAddr),
          tokenOut:  getTokenSymbol(tOutAddr),
          amountIn:  parseFloat(formatUnits(args.amountIn  ?? BigInt(0), tokenInDecimals)).toFixed(4),
          amountOut: parseFloat(formatUnits(args.amountOut ?? BigInt(0), tokenOutDecimals)).toFixed(4),
        };
      });

      const paidTxs: Transaction[] = paidLogs.map(log => {
        const args = log.args as {
          paymentToken?: `0x${string}`;
          amountPaid?: bigint;
        };
        const tAddr = args.paymentToken?.toLowerCase() ?? '';
        const tDecimals = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tAddr)?.decimals ?? 6;
        return {
          id: `paid-${log.transactionHash}-${log.logIndex}`,
          type: 'invoice_paid',
          txHash: log.transactionHash!,
          blockNumber: log.blockNumber ?? BigInt(0),
          tokenSymbol: getTokenSymbol(tAddr),
          amount: parseFloat(formatUnits(args.amountPaid ?? BigInt(0), tDecimals)).toFixed(4),
        };
      });

      const sendTxs: Transaction[] = sendLogs.map(log => {
        const tAddress = log.address.toLowerCase();
        const token = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tAddress);
        const args = log.args as {
          to?: `0x${string}`;
          value?: bigint;
        };
        return {
          id: `send-${log.transactionHash}-${log.logIndex}`,
          type: 'send',
          txHash: log.transactionHash!,
          blockNumber: log.blockNumber ?? BigInt(0),
          tokenSymbol: token?.symbol ?? getTokenSymbol(tAddress),
          to: args?.to,
          amount: parseFloat(formatUnits(args?.value ?? BigInt(0), token?.decimals ?? 6)).toFixed(4),
        };
      });

      const receiveTxs: Transaction[] = receiveLogs.map(log => {
        const tAddress = log.address.toLowerCase();
        const token = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tAddress);
        const args = log.args as {
          from?: `0x${string}`;
          value?: bigint;
        };
        return {
          id: `receive-${log.transactionHash}-${log.logIndex}`,
          type: 'receive',
          txHash: log.transactionHash!,
          blockNumber: log.blockNumber ?? BigInt(0),
          tokenSymbol: token?.symbol ?? getTokenSymbol(tAddress),
          from: args?.from,
          amount: parseFloat(formatUnits(args?.value ?? BigInt(0), token?.decimals ?? 6)).toFixed(4),
        };
      });

      // Filter out receive txs that are also swap or router operations to avoid duplicates
      // Router usually calls transfer internally, but we might pick it up.
      // If the sender is the router or caller is router, maybe ignore. 
      // A simple heuristic: if from/to is ROUTER_ADDRESS, filter out.
      const isRouter = (addr?: string) => addr?.toLowerCase() === ROUTER_ADDRESS.toLowerCase();
      const filteredSend = sendTxs.filter(tx => !isRouter(tx.to));
      const filteredReceive = receiveTxs.filter(tx => !isRouter(tx.from));

      const all = [...swapTxs, ...paidTxs, ...filteredSend, ...filteredReceive].sort(
        (a, b) => Number(b.blockNumber) - Number(a.blockNumber)
      );
      
      // Deduplicate by txHash just in case there are multiple transfers in one tx we don't want flooding, or keep them if detailed.
      // Let's keep them and rely on ID uniqueness.
      setTransactions(all);
    } catch (err) {
      console.error('[useTransactions]', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    fetchTxs();
    const interval = setInterval(fetchTxs, 30_000);
    return () => clearInterval(interval);
  }, [fetchTxs]);

  return { transactions, isLoading, refetch: fetchTxs };
}
