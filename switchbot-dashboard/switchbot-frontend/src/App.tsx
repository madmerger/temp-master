import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppThemeProvider } from './context/ThemeContext';
import Dashboard from './components/Dashboard/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <Dashboard />
      </AppThemeProvider>
    </QueryClientProvider>
  );
}
