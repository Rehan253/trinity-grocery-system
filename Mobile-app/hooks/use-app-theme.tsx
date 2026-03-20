import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AppPalette } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type AppTheme = "light" | "dark";

type AppThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  palette: (typeof AppPalette)["light"] | (typeof AppPalette)["dark"];
  toggleTheme: () => void;
};

const AppThemeContext = createContext<AppThemeContextValue | undefined>(
  undefined,
);

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<AppTheme>(
    systemScheme === "dark" ? "dark" : "light",
  );

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(() => {
    const isDark = theme === "dark";

    return {
      theme,
      isDark,
      palette: isDark ? AppPalette.dark : AppPalette.light,
      toggleTheme,
    };
  }, [theme, toggleTheme]);

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
