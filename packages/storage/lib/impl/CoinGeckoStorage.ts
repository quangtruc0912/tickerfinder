import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

export type CoinGeckoContractAddress = string[];

type CoinGeckoStorage = BaseStorage<CoinGeckoContractAddress> & {
  setContractAddress: (addresses: string[]) => Promise<void>;
  getContractAddress: () => Promise<Set<string>>;
};

const storage = createStorage<CoinGeckoContractAddress>('COINGECKOCA', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const coinGeckoStorage: CoinGeckoStorage = {
  ...storage,

  setContractAddress: async (addresses: string[]) => {
    await storage.set(() => addresses.map(addr => addr.toLowerCase()));
  },

  getContractAddress: async () => {
    const result = await storage.get();
    return new Set(result); // Convert array to Set
  },
};
