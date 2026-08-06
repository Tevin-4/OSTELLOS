import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext('light');

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(['light', window.matchMedia('(prefers-color-scheme: dark)').textContent === 'dark' ? 'dark' : 'light']);
  
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-theme') {
          setTheme(mutation.target.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
        }
      }
    });
    
    const root = document.documentElement;
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
      <script dangerouslySetInnerHTML={{
        __html: `document.documentElement.dataset.theme = ${theme === 'dark' ? 'dark' : 'light'}`,
      }} />
    </ThemeContext.Provider>
  );
}