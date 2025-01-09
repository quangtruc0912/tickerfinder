import { toggleTheme } from '@src/toggleTheme';
import { TICKER_PROCESSED, HIGHTLIGHTED_COLOR, injectReact } from '@extension/shared';
import { PRIORITYCHAINLIST } from '@extension/shared';

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

function getUniqueTextContentFromPriority(
  elements: HTMLElement[],
  priorityChainList: readonly [string, string][],
): string[] {
  const priorityKeys = new Set(priorityChainList.map(([key]) => key));
  console.log(priorityKeys);

  const uniqueTexts = new Set<string>();

  elements.forEach(element => {
    if (element && element.textContent) {
      const text = element.textContent.trim().toUpperCase().substring(1);

      if (text && priorityKeys.has(text)) {
        uniqueTexts.add(text);
      }
    }
  });

  // Convert the set to an array for the result
  return Array.from(uniqueTexts);
}

const injectIndicating = async () => {
  const regexStr = /\$(\w)+/g;

  //FIND FROM A , COULD BE DIV AND SPAN NEXT, EACH HAVE DIF WAY TO IMPLEMENT
  const elements = Array.from(document.querySelectorAll('a'));

  var filteredElements = elements.filter(
    el => el.textContent && el.textContent.match(regexStr) && el.dataset[TICKER_PROCESSED],
  );

  var uniqueTickers = getUniqueTextContentFromPriority(filteredElements, PRIORITYCHAINLIST);
  uniqueTickers.forEach((ticker: string) => {
    chrome.runtime.sendMessage({ type: 'FETCH_KUCOIN', ticker }, response => {
      if (response.data) {
        filteredElements.forEach(element => {
          let temp = element.textContent?.toUpperCase().substring(1);
          if (temp === ticker) {
            element.textContent = element.textContent + '123';
          }
        });
      } else {
        console.error('Error:', response.error);
      }
    });
  });
};

const throttledInjecTicker = _.throttle(injectTicker, 5000);
const throttledInjecIndicating = _.throttle(injectIndicating, 5000);

const setupInjections = async () => {
  const globalContainer = document.createElement('div');
  document.body.appendChild(globalContainer);

  injectReact(<TickerPopup />, globalContainer);

  const observer = new MutationObserver(() => {
    throttledInjecTicker();
    throttledInjecIndicating();
  });

  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
  });
};

console.log('content script loaded zzz');

setupInjections();
