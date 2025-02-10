import { createRoot } from 'react-dom/client';
import App from '@src/App';
import { injectReact } from '@extension/shared';

// @ts-ignore
import injectedStyle from '@src/index.css?inline';

export function mount() {
  let root = document.getElementById('runtime-content-view-root');

  if (root) {
    // ✅ Shadow root exists, toggle modal visibility
    const event = new CustomEvent('toggle-modal');
    document.dispatchEvent(event);
    return;
  }

  // 🔹 If no shadow root, create one
  root = document.createElement('div');
  root.id = 'runtime-content-view-root';
  document.body.append(root);

  const shadowRoot = root.attachShadow({ mode: 'open' });

  const styleElement = document.createElement('style');
  styleElement.innerHTML = injectedStyle;
  shadowRoot.appendChild(styleElement);

  const rootIntoShadow = document.createElement('div');
  rootIntoShadow.id = 'shadow-root';
  shadowRoot.appendChild(rootIntoShadow);

  injectReact(<App />, rootIntoShadow);
}
