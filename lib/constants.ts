// Application constants

// Currency configuration
export const CURRENCY = {
  TICKER: "USDC",
  NAME: "US Dollar",
  SYMBOL: "USDC",
  DECIMALS: 2,
} as const;

// Blockchain configuration
export const BLOCKCHAIN = {
  // Sepolia Testnet USDC Contract
  TOKEN_CONTRACT_ADDRESS: "0x5069B457800815A96EB31D08116753ba6A645Bd9",
  // Sepolia Testnet RPC via Infura
  RPC_URL: "https://sepolia.infura.io/v3/c730e202ad454729ad11b835de78bfc8",
  // Alternative public RPC for Sepolia
  RPC_FALLBACK: "https://sepolia.drpc.org",
  NETWORK_NAME: "Sepolia Testnet",
  CHAIN_ID: 11155111,
} as const;

// Token ABI for ERC-20 operations
export const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)", 
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function name() view returns (string)",
  // Minting functions (if contract supports)
  "function mint(address to, uint256 amount) returns (bool)",
  "function owner() view returns (address)"
] as const;

// Default values
export const DEFAULTS = {
  SERVICE_PRICE: 0.25,
  WALLET_BALANCE: 0,
  DEPOSIT_AMOUNT: 100,
  GAS_ETH_AMOUNT: 0.001,
} as const;

// Application metadata
export const APP = {
  NAME: "Vypr",
  DESCRIPTION: "Agent-to-Agent Payment Infrastructure",
} as const;
