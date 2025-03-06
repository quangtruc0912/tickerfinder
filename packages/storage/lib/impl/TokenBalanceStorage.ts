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

interface TokenData {
  token: Token;
  token_id: string | null;
  token_instance: string | null;
  value: string;
}

const TOKENBALANCE_KEY = 'TOKENBALANCE';

//clear stuff
// chrome.storage.local.clear();

type ITokenBalanceStorage = BaseStorage<TokenData[]> & {
  addTokenBalance: (item: TokenData) => Promise<void>;
  updateTokensBalance: (item: TokenData[]) => Promise<void>;
  removeFromTokenBalance: (address: string) => Promise<void>;
  getTokenBalanace: () => Promise<TokenData[]>;
};

const tokenBalanceStorage = createStorage<TokenData[]>(TOKENBALANCE_KEY, [], {
  liveUpdate: true,
});

export const useTokenBalanceStorage: ITokenBalanceStorage = {
  ...tokenBalanceStorage,
  addTokenBalance: async item => {
    const currentList = await tokenBalanceStorage.get();

    const isAlreadyAdded = currentList?.some(existingItem => existingItem.token.address === item.token.address);

    if (!isAlreadyAdded) {
      await tokenBalanceStorage.set([...currentList, item]);
    }
  },
  updateTokensBalance: async item => {
    try {
      const currentList = ((await tokenBalanceStorage.get()) as TokenData[]) || [];

      const newTokenAddresses = new Set(item.map(token => token.token.address));

      const currentMap = new Map(currentList.map(token => [token.token.address, token]));

      for (const newToken of item) {
        const tokenAddress = newToken.token.address;

        if (currentMap.has(tokenAddress)) {
          currentMap.get(tokenAddress)!.value = newToken.value;
        } else {
          currentMap.set(tokenAddress, newToken);
        }
      }

      for (const storedTokenAddress of currentMap.keys()) {
        if (!newTokenAddresses.has(storedTokenAddress)) {
          currentMap.delete(storedTokenAddress);
        }
      }

      const updatedList = Array.from(currentMap.values());

      await tokenBalanceStorage.set(updatedList);

      console.log('Watchlist successfully updated!', updatedList);
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
};
