import { createTheme } from '@mui/material/styles';

const sunsetTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ff6b35' },
    secondary: { main: '#f72585' },
    background: {
      default: '#1a0a2e',
      paper: '#2d1b4e',
    },
    text: {
      primary: '#fce4ec',
      secondary: '#f48fb1',
    },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});

export default sunsetTheme;
