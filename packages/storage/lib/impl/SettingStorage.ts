import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

export type Setting = {
  changeRate: boolean;
  tickerBackgroundColor: string; // Added hexColor property
};

type SettingStorage = BaseStorage<Setting> & {
  toggleChangeRate: () => Promise<void>;
  changeTickerBackgroundColor: (color: string) => Promise<void>; // Method to change color
  getSetting: () => Promise<Setting>;
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
  getSetting: async () => {
    var result = await storage.get();
    return result;
  },
};
