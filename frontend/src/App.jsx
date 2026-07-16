import React from 'react';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useApp } from './context/AppContext';
import { AppRoutes } from './routes';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

const AppContent = () => {
  const { theme } = useApp();
  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" theme={theme} />
    </>
  );
};

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AppProvider>
    </QueryClientProvider>
  );
};
export default App;
