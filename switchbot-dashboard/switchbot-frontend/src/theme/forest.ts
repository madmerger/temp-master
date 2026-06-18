import { createTheme } from '@mui/material/styles';

const forestTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#76ff03' },
    secondary: { main: '#00e676' },
    background: {
      default: '#0d1f0d',
      paper: '#1b3a1b',
    },
    text: {
      primary: '#e8f5e9',
      secondary: '#a5d6a7',
    },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});

export default forestTheme;
