export interface WalletLike {
  address?: string;
  walletClientType?: string;
}

/**
 * Returns the most relevant wallet address for app actions.
 * Prefer external wallets when present, otherwise fallback to Privy embedded.
 */
export function getActiveWalletAddress(
  wallets: WalletLike[] | undefined,
): `0x${string}` | undefined {
  if (!wallets?.length) return undefined;

  const external = wallets.find(
    (wallet) => wallet.address && wallet.walletClientType !== 'privy',
  );
  if (external?.address) return external.address as `0x${string}`;

  const embedded = wallets.find(
    (wallet) => wallet.address && wallet.walletClientType === 'privy',
  );
  if (embedded?.address) return embedded.address as `0x${string}`;

  const fallback = wallets.find((wallet) => wallet.address);
  return fallback?.address as `0x${string}` | undefined;
}
