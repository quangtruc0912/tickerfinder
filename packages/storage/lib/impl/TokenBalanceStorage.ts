import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

interface Token {
  address: string;
  circulating_market_cap: string;
  decimals: string;
  exchange_rate: string;
  holders: string;
  icon_url: string;
  name: string;
  symbol: string;
  total_supply: string;
  type: string;
  volume_24h: string;
}
interface TokenCEX {
  exchange_rate: string;
  change_24h: string | null;
}

export interface TokenBalanceData {
  token: Token;
  token_cex: TokenCEX;
  token_id: string | null;
  token_instance: string | null;
  value: string;
}

const TOKENBALANCE_KEY = 'TOKENBALANCE';

//clear stuff
// chrome.storage.local.clear();

type ITokenBalanceStorage = BaseStorage<TokenBalanceData[]> & {
  addTokenBalance: (item: TokenBalanceData) => Promise<void>;
  updateTokensBalance: (item: TokenBalanceData[]) => Promise<void>;
  removeFromTokenBalance: (address: string) => Promise<void>;
  getTokenBalanace: () => Promise<TokenBalanceData[]>;
  removeAllTokenBalance: () => Promise<void>;
};

const TokenBalanceStorage = createStorage<TokenBalanceData[]>(TOKENBALANCE_KEY, [], {
  liveUpdate: true,
});

export const tokenBalanceStorage: ITokenBalanceStorage = {
  ...TokenBalanceStorage,
  addTokenBalance: async item => {
    const currentList = await tokenBalanceStorage.get();

    const isAlreadyAdded = currentList?.some(existingItem => existingItem.token.address === item.token.address);

    if (!isAlreadyAdded) {
      await tokenBalanceStorage.set([...currentList, item]);
    }
  },
  updateTokensBalance: async item => {
    try {
      await tokenBalanceStorage.set(item);
    } catch (error) {
      console.error('Error updating tokens balance:', error);
    }
  },
  removeFromTokenBalance: async address => {
    const currentList = await tokenBalanceStorage.get();
    const updatedList = currentList.filter(item => item.token.address !== address);

    await tokenBalanceStorage.set(updatedList);
  },
  getTokenBalanace: async () => {
    const list = await tokenBalanceStorage.get();

    return list;
  },
  removeAllTokenBalance: async () => {
    await tokenBalanceStorage.set([]);
  },
};
