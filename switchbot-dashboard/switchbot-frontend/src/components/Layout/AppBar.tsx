import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ThemeSwitcher from '../ThemeSwitcher';

export default function AppBar() {
  return (
    <MuiAppBar position="fixed" enableColorOnDark>
      <Toolbar>
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          Temp Master Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ThemeSwitcher />
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
}
