import '@src/index.css';
import SidePanel from '@src/SidePanel';
import { injectReact } from '@extension/shared';
function init() {
  const appContainer = document.querySelector('#app-container') as HTMLElement;
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }

  injectReact(<SidePanel />, appContainer);
}

init();
