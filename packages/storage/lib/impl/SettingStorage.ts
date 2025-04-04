import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

export type Setting = {
  changeRate: boolean;
  tickerBackgroundColor: string; // Added hexColor property
  address: string;
  coinBalanceLowerThreshold: number;
  lastFetchWatchList: number;
  lastFetchCoinBalance: number;
};

const defaultSetting: Setting = {
  changeRate: false,
  tickerBackgroundColor: '#FFFFFF',
  address: '',
  coinBalanceLowerThreshold: 10,
  lastFetchCoinBalance: 0,
  lastFetchWatchList: 0,
};

function ensureSetting(obj: Partial<Setting>): Setting {
  return {
    ...defaultSetting,
    ...obj,
  };
}

type SettingStorage = BaseStorage<Setting> & {
  toggleChangeRate: () => Promise<void>;
  changeTickerBackgroundColor: (color: string) => Promise<void>;
  setAddress: (address: string) => Promise<void>;
  getSetting: () => Promise<Setting>;
  ensureSetting: () => Promise<void>;
  setLowerThreshold: (number: number) => Promise<void>;
  setLastFetchWatchList: (number: number) => Promise<void>;
  setLastFetchCoinBalance: (number: number) => Promise<void>;
};

const storage = createStorage<Setting>(
  'SETTING',
  {
    changeRate: false,
    tickerBackgroundColor: '#add8e6', // Default color is white
  } as Setting,
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const settingStorage: SettingStorage = {
  ...storage,
  toggleChangeRate: async () => {
    await storage.set(currentSetting => ({
      ...currentSetting,
      changeRate: !currentSetting.changeRate,
    }));
  },
  changeTickerBackgroundColor: async (color: string) => {
    await storage.set(currentSetting => ({
      ...currentSetting,
      tickerBackgroundColor: color, // Update hexColor with new value
    }));
  },
  setAddress: async (address: string) => {
    await storage.set(currentSetting => ({
      ...currentSetting,
      address: address, // Update hexColor with new value
    }));
  },
  getSetting: async () => {
    var result = await storage.get();
    return result;
  },
  ensureSetting: async () => {
    var setting = ensureSetting(await storage.get());
    await storage.set(setting);
  },
  setLowerThreshold: async (number: number) => {
    await storage.set(currentSetting => ({
      ...currentSetting,
      coinBalanceLowerThreshold: number,
    }));
  },
  setLastFetchCoinBalance: async (number: number) => {
    await storage.set(currentSetting => ({
      ...currentSetting,
      lastFetchCoinBalance: number,
    }));
  },
  setLastFetchWatchList: async (number: number) => {
    await storage.set(currentSetting => ({
      ...currentSetting,
      lastFetchWatchList: number,
    }));
  },
};
