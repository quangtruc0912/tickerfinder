import { mount } from '@src/Root';
import { TICKER_PROCESSED } from '@extension/shared';

import _ from 'lodash';

const injectTicker = async () => {
  const node = document.querySelector('test') as HTMLElement | null;
  if (node && !node.dataset[TICKER_PROCESSED]) {
    node.dataset[TICKER_PROCESSED] = '1';
  }
};

const throttledInjecTicker = _.throttle(injectTicker, 3000);

const setupInjections = async () => {
  const observer = new MutationObserver(() => {
    throttledInjecTicker();
  });

  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });
};
mount();

console.log('runtime script loaded');
