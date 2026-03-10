// ─── ReTempRouter ABI ──────────────────────────────────────────────────────────
// Extracted from ReTempRouter.sol

export const ROUTER_ABI = [
  // ── routeSwap ──────────────────────────────────────────────────────────────
  {
    name: 'routeSwap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn',  type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      // minAmountOut REMOVED — kontrak on-chain hanya terima 3 params
    ],
    outputs: [],
  },

  // ── createInvoice ──────────────────────────────────────────────────────────
  {
    name: 'createInvoice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token',  type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'invoiceId', type: 'uint256' }],
  },

  // ── payInvoice ─────────────────────────────────────────────────────────────
  {
    name: 'payInvoice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'invoiceId',    type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
    ],
    outputs: [],
  },

  // ── getInvoice ─────────────────────────────────────────────────────────────
  {
    name: 'getInvoice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'merchant', type: 'address' },
          { name: 'token',    type: 'address' },
          { name: 'amount',   type: 'uint256' },
          { name: 'paid',     type: 'bool' },
        ],
      },
    ],
  },

  // ── quotePayment ───────────────────────────────────────────────────────────
  {
    name: 'quotePayment',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'invoiceId',    type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
    ],
    outputs: [{ name: 'requiredIn', type: 'uint256' }],
  },

  // ── getPool ────────────────────────────────────────────────────────────────
  {
    name: 'getPool',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },

  // ── State reads ────────────────────────────────────────────────────────────
  {
    name: 'hubToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'treasury',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'invoiceCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'ROUTER_FEE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // ── Events ─────────────────────────────────────────────────────────────────
  {
    name: 'SwapRouted',
    type: 'event',
    inputs: [
      { name: 'sender',    type: 'address', indexed: true },
      { name: 'tokenIn',   type: 'address', indexed: true },
      { name: 'tokenOut',  type: 'address', indexed: true },
      { name: 'amountIn',  type: 'uint256', indexed: false },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'InvoiceCreated',
    type: 'event',
    inputs: [
      { name: 'invoiceId', type: 'uint256', indexed: true },
      { name: 'merchant',  type: 'address', indexed: true },
      { name: 'token',     type: 'address', indexed: false },
      { name: 'amount',    type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'InvoicePaid',
    type: 'event',
    inputs: [
      { name: 'invoiceId',    type: 'uint256', indexed: true },
      { name: 'payer',        type: 'address', indexed: true },
      { name: 'paymentToken', type: 'address', indexed: false },
      { name: 'amountPaid',   type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'PoolRegistered',
    type: 'event',
    inputs: [
      { name: 'tokenA', type: 'address', indexed: true },
      { name: 'tokenB', type: 'address', indexed: true },
      { name: 'pool',   type: 'address', indexed: true },
    ],
  },
] as const;

// ─── ReTempPool ABI ──────────────────────────────────────────────────────────
export const POOL_ABI = [
  {
    name: 'swap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn',  type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'getAmountOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'tokenIn',  type: 'address' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'getReserves',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'reserveA', type: 'uint256' },
      { name: 'reserveB', type: 'uint256' },
    ],
  },
  {
    name: 'getPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'price', type: 'uint256' }],
  },
  {
    name: 'tokenA',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'tokenB',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;