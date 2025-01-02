import { useState, useEffect } from 'react';
import { Pair } from '../models/ticker';

export function useDexScreener(ticker: string) {
  const [state, setState] = useState<{ data: Pair[]; isLoading: boolean }>({
    data: [],
    isLoading: true,
  });

  const updateState = (data: Pair[] | null) => {
    setState(state => ({
      data: data ? data : state.data,
      isLoading: false,
    }));
  };

  async function init() {
    try {
      if (ticker) {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${ticker}`, {
          method: 'GET',
          headers: {},
        });

        const data = await res.json();

        updateState(data.pairs);
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    init();
    const id = setInterval(
      () => {
        init();
      },
      1 * 60 * 1000,
    ); // 1 min interval to update the data
    return () => clearInterval(id);
  }, [ticker]);
  return state;
}
