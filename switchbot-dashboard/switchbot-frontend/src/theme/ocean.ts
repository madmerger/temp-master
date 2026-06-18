import { createTheme } from '@mui/material/styles';

const oceanTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#26c6da' },
    secondary: { main: '#0288d1' },
    background: {
      default: '#0a1929',
      paper: '#132f4c',
    },
    text: {
      primary: '#e3f2fd',
      secondary: '#90caf9',
    },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' },
});

export default oceanTheme;
