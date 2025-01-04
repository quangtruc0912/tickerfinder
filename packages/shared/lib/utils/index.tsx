export * from './shared-types';
import { createRoot } from 'react-dom/client';
import { useStorage } from '../hooks/useStorage';
import { exampleThemeStorage } from '@extension/storage';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const themeLight = createTheme({
  palette: {
    background: {
      default: '#fff',
    },
    text: {
      primary: '#000',
    },
  },
});

const themeDark = createTheme({
  palette: {
    background: {
      default: '#333',
    },
    text: {
      primary: '#fff',
    },
  },
});

const AppProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';

  return <ThemeProvider theme={isLight ? themeLight : themeDark}>{children}</ThemeProvider>;
};

export const injectReact = (content: React.ReactNode, target: HTMLElement) => {
  const root = createRoot(target);
  root.render(<AppProvider>{content}</AppProvider>);
};
