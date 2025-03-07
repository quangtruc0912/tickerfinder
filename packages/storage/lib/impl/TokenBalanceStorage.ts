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

export interface TokenBalanceData {
  token: Token;
  token_id: string | null;
  token_instance: string | null;
  value: string;
}

export function extendTokenBalance(data: TokenBalanceData) {
  const normalizedBalance = Number(data.value) / 10 ** Number(data.token.decimals);
  return {
    ...data,
    normalizedBalance,
    totalValue: normalizedBalance * Number(data.token.exchange_rate),
  };
}

const TOKENBALANCE_KEY = 'TOKENBALANCE';

//clear stuff
// chrome.storage.local.clear();

type ITokenBalanceStorage = BaseStorage<TokenBalanceData[]> & {
  addTokenBalance: (item: TokenBalanceData) => Promise<void>;
  updateTokensBalance: (item: TokenBalanceData[]) => Promise<void>;
  removeFromTokenBalance: (address: string) => Promise<void>;
  getTokenBalanace: () => Promise<TokenBalanceData[]>;
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
      const currentList = ((await tokenBalanceStorage.get()) as TokenBalanceData[]) || [];

      // Filter out tokens where exchangeRate is null
      const filteredItems = item.filter(token => token.token.exchange_rate !== null);

      const newTokenAddresses = new Set(filteredItems.map(token => token.token.address));

      const currentMap = new Map(currentList.map(token => [token.token.address, token]));

      for (const newToken of filteredItems) {
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

      console.log('Token balance successfully updated!', updatedList);
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
