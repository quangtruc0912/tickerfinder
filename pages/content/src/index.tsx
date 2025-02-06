import { toggleTheme } from '@src/toggleTheme';
import { TICKER_PROCESSED, HIGHTLIGHTED_COLOR, injectReact, ArrowDirection } from '@extension/shared';
import { PRIORITYCHAINLIST, useStorage } from '@extension/shared';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { createRoot } from 'react-dom/client';
import _ from 'lodash';
import TickerPopup from '@src/TickerPopup';
import { settingStorage } from '@extension/storage';

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

  filteredTickers.forEach(async ({ node, type }) => {
    if (node.dataset[TICKER_PROCESSED]) return;

    //FIND BETTER SOLUTION FOR DIR/ LTR JUST TEMPORARY
    if (type === 'a' && node.dir == 'ltr') {
      const setting = await settingStorage.getSetting();
      node.dataset[TICKER_PROCESSED] = '1';
      node.dataset.popupText = node?.textContent ?? undefined;
      node.style.backgroundColor = !setting.tickerBackgroundColor ? HIGHTLIGHTED_COLOR : setting.tickerBackgroundColor;
    }
  });
};

function getUniqueTextContentFromPriority(
  elements: HTMLElement[],
  priorityChainList: readonly [string, string][],
): string[] {
  const priorityKeys = new Set(priorityChainList.map(([key]) => key));
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

const renderIndicator = (ele: HTMLElement, percentChange: number) => {
  let span = ele.querySelector('span[data-arrow]') as HTMLElement | null;
  ele.style.display = 'inline-flex';
  ele.style.alignItems = 'center';
  const arrowDirection: ArrowDirection = percentChange > 0 ? 'up' : 'down';
  if (!span) {
    span = document.createElement('span');
    span.setAttribute('data-arrow', 'true');
    span.style.display = 'inline-flex'; // Use flexbox for alignment
    span.style.alignItems = 'center'; // Vertical centering
    arrowDirection === 'up' ? (span.style.color = 'green') : (span.style.color = 'red');
    ele.appendChild(span);
  }

  span.innerHTML = ' ';
  // Create a container for the icon and render it
  const iconContainer = document.createElement('span');
  iconContainer.style.display = 'flex'; // Flexbox ensures proper alignment
  iconContainer.style.alignItems = 'center'; // Center vertically
  iconContainer.style.justifyContent = 'center';
  span.appendChild(iconContainer);

  const root = createRoot(iconContainer);
  root.render(arrowDirection === 'up' ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />);
};

const injectIndicating = async () => {
  const regexStr = /\$(\w)+/g;

  //FIND FROM A , COULD BE DIV AND SPAN NEXT, EACH HAVE DIF WAY TO IMPLEMENT
  const elements = Array.from(document.querySelectorAll('a'));

  const spans = Array.from(document.querySelectorAll('span'));

  var filteredSpan = spans.filter(el => el.textContent && el.textContent.match(regexStr) && el.dataset.popupText);

  var filteredElements = elements.filter(
    el => el.textContent && el.textContent.match(regexStr) && el.dataset[TICKER_PROCESSED],
  );

  var uniqueTickersElements = getUniqueTextContentFromPriority(filteredElements, PRIORITYCHAINLIST);

  var uniqueTickersSpan = getUniqueTextContentFromPriority(filteredSpan, PRIORITYCHAINLIST);

  var uniqueTickers = uniqueTickersElements.concat(uniqueTickersSpan);

  console.log(filteredSpan);

  uniqueTickers.forEach((ticker: string) => {
    chrome.runtime.sendMessage({ type: 'FETCH_KUCOIN', ticker }, response => {
      if (response.data) {
        filteredElements.forEach(element => {
          let temp = element.textContent?.toUpperCase().substring(1);
          if (temp === ticker) {
            renderIndicator(element, response.data.changeRate);
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

// console.log('content script loaded zzz');

setupInjections();
