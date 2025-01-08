export * from './shared-types';
import { createRoot } from 'react-dom/client';
import { useStorage } from '../hooks/useStorage';
import { exampleThemeStorage } from '@extension/storage';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
declare module '@mui/material/styles' {
  interface Palette {
    border: {
      default: string;
    };
  }
  interface PaletteOptions {
    border?: {
      default: string;
    };
  }
}
const themeLight = createTheme({
  palette: {
    background: {
      default: '#fff',
    },
    text: {
      primary: '#000',
    },
    border: {
      default: '#ccc', // Light theme border color
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
    border: {
      default: '#555', // Dark theme border color
    },
  },
});

const AppProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';

  return (
    <BrowserRouter>
      <ThemeProvider theme={isLight ? themeLight : themeDark}>{children}</ThemeProvider>
    </BrowserRouter>
  );
};

export const injectReact = (content: React.ReactNode, target: HTMLElement) => {
  const root = createRoot(target);
  root.render(<AppProvider>{content}</AppProvider>);
};
