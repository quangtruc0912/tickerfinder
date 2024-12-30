import { toggleTheme } from '@src/toggleTheme';
import { TICKER_PROCESSED, HIGHTLIGHTED_COLOR } from '@extension/shared';

import _ from 'lodash';
import TickerPopup from './TickerPopup';

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

document.addEventListener('mouseover', event => {
  const target = event.target;

  if (target instanceof HTMLElement && target?.dataset[TICKER_PROCESSED]) {
    console.log('Yes Sir');
  }

  // if (shouldShowPopup(target)) {
  //   // console.debug("Hovering over GitHub link: ", target.href);
  //   isMouseOverLink = true;
  //   currentHoverTarget = target;

  //   if (lastTarget !== target) {
  //     lastTarget = target;
  //     if (currentPopup) {
  //       currentPopup.remove();
  //       currentPopup = null;
  //     }
  //   }

  //   if (popupTimeout) {
  //     clearTimeout(popupTimeout);
  //   }
  //   popupTimeout = setTimeout(async () => {
  //     if (isMouseOverLink && target === currentHoverTarget) {
  //       await createNewPopup(target);
  //     }
  //   }, popupDelay);
  // }
});
