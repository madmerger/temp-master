import { useCallback, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import {
  applyTheme,
  getThemeById,
  loadSavedThemeId,
  saveThemeId,
} from './themes/themes';
import type { ThemeId } from './types';

export default function App() {
  const [themeId, setThemeId] = useState<ThemeId>(loadSavedThemeId);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    applyTheme(getThemeById(themeId));
  }, [themeId]);

  const handleThemeChange = useCallback((id: ThemeId) => {
    setThemeId(id);
    saveThemeId(id);
  }, []);

  return (
    <>
      <Navbar
        connected={connected}
        themeId={themeId}
        onThemeChange={handleThemeChange}
      />
      <Dashboard onConnectionChange={setConnected} themeId={themeId} />
    </>
  );
}
