import { toggleTheme } from '@src/toggleTheme';
import { TICKER_PROCESSED, HIGHTLIGHTED_COLOR } from '@extension/shared';

import _ from 'lodash';

const injectTicker = async () => {
  const regexStr = /\$(\w)+/g;

  //FIND FROM A , COULD BE DIV AND SPAN NEXT, EACH HAVE DIF WAY TO IMPLEMENT
  const aNodes = Array.from(document.querySelectorAll('a'));

  var tickerNodes = [
    ...aNodes.map(node => ({
      node,
      type: 'a',
    })),
  ] as {
    node: HTMLElement;
    type: string;
  }[];

  var filteredTickers = tickerNodes.filter(el => el.node.textContent && el.node.textContent.match(regexStr));

  filteredTickers.forEach(({ node, type }) => {
    if (node.dataset[TICKER_PROCESSED]) return;

    //FIND BETTER SOLUTION FOR DIR/ LTR JUST TEMPORARY
    if (type === 'a' && node.dir == 'ltr') {
      console.log(node);
      node.dataset[TICKER_PROCESSED] = '1';
      node.style.backgroundColor = HIGHTLIGHTED_COLOR;
    }
  });
  // if (node && !node.dataset[TICKER_PROCESSED]) {
  //   const gridNodes = Array.from(
  //     document.querySelectorAll(selectors.assetInfo.grid.node.selector),
  //   )
  //   node.dataset[TICKER_PROCESSED] = '1';
  // }
};

const throttledInjecTicker = _.throttle(injectTicker, 5000);

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

console.log('content script loaded');

void toggleTheme();
setupInjections();
