export function detectBlockchain(address: string): string | null {
  if (!address || typeof address !== 'string') {
    return null;
  }

  const chainPatterns: { [key: string]: RegExp } = {
    BTC: /^(1|3)[a-zA-HJ-NP-Z0-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/, // Bitcoin
    ETH: /^0x[a-fA-F0-9]{40}$/, // Ethereum, EVM Chains (Polygon, BSC, Arbitrum, etc.)
    BNB: /^0x[a-fA-F0-9]{40}$/, // Binance Smart Chain
    AVAX: /^0x[a-fA-F0-9]{40}$/, // Avalanche
    MATIC: /^0x[a-fA-F0-9]{40}$/, // Polygon
    ARB: /^0x[a-fA-F0-9]{40}$/, // Arbitrum
    OP: /^0x[a-fA-F0-9]{40}$/, // Optimism
    TRX: /^T[a-zA-Z0-9]{33}$/, // Tron
    XRP: /^r[a-zA-Z0-9]{24,34}$/, // XRP Ledger
    SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, // Solana
    ADA: /^(addr1|DdzFF)[a-zA-Z0-9]{58,}$/, // Cardano
    DOT: /^1[a-km-zA-HJ-NP-Z1-9]{47,48}$/, // Polkadot
    NEAR: /^(?:[a-zA-Z0-9_-]{5,64}\.near|[a-fA-F0-9]{64})$/, // NEAR Protocol
    OSMO: /^osmo1[a-zA-HJ-NP-Z0-9]{38}$/, // Osmosis
    CRO: /^cro1[a-zA-HJ-NP-Z0-9]{38}$/, // Cronos
    APT: /^[A-Za-z0-9]{64}$/, // Aptos (simple check, more validation may be needed)
    ICP: /^[a-z0-9]{27,63}$/, // Internet Computer (ICP)
    ALGO: /^[A-Z2-7]{58}$/, // Algorand
    HBAR: /^0\.0\.[0-9]+$/, // Hedera
    EGLD: /^erd[a-z0-9]{58}$/, // MultiversX (Elrond)
    MOVR: /^0x[a-fA-F0-9]{40}$/, // Moonriver
    CELO: /^0x[a-fA-F0-9]{40}$/, // Celo
    ZK: /^0x[a-fA-F0-9]{40}$/, // zkSync
    SCR: /^0x[a-fA-F0-9]{40}$/, // Scroll
    WAN: /^0x[a-fA-F0-9]{40}$/, // Wanchain
    ETC: /^0x[a-fA-F0-9]{40}$/, // Ethereum Classic
    SEI: /^sei1[a-zA-HJ-NP-Z0-9]{38}$/, // Sei Network
    FLR: /^0x[a-fA-F0-9]{40}$/, // Flare Network
    INJ: /^inj1[a-zA-HJ-NP-Z0-9]{38}$/, // Injective
    ZETA: /^zeta1[a-zA-HJ-NP-Z0-9]{38}$/, // ZetaChain
    TT: /^0x[a-fA-F0-9]{40}$/, // ThunderCore
  };

  for (const [chain, pattern] of Object.entries(chainPatterns)) {
    if (pattern.test(address)) {
      console.log(address);
      console.log(chain);
      return chain;
    }
  }

  return null;
}
