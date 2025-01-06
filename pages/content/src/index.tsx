import { toggleTheme } from '@src/toggleTheme';
import { TICKER_PROCESSED, HIGHTLIGHTED_COLOR, injectReact } from '@extension/shared';

import _ from 'lodash';
import TickerPopup from '@src/TickerPopup';

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
      node.dataset[TICKER_PROCESSED] = '1';
      node.dataset.popupText = node?.textContent ?? undefined;
      node.style.backgroundColor = HIGHTLIGHTED_COLOR;
    }
  });
};

const throttledInjecTicker = _.throttle(injectTicker, 5000);

const setupInjections = async () => {
  const globalContainer = document.createElement('div');
  document.body.appendChild(globalContainer);

  injectReact(<TickerPopup />, globalContainer);

  const observer = new MutationObserver(() => {
    throttledInjecTicker();
  });

  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });
};

console.log('content script loaded zzz');

setupInjections();
