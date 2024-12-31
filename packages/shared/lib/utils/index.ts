export * from './shared-types';
import { createRoot } from 'react-dom/client';

export const injectReact = (content: React.ReactNode, target: HTMLElement) => {
  const root = createRoot(target);
  root.render(content);
};
