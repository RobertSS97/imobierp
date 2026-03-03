"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Theme = "light" | "dark" | "system";

type PrimaryColor = "default" | "blue" | "green" | "purple" | "amber" | "red";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: PrimaryColor;
  setPrimaryColor: (color: PrimaryColor) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const primaryColors: Record<PrimaryColor, { light: string; dark: string }> = {
  default: {
    light: "oklch(0.205 0 0)",
    dark: "oklch(0.922 0 0)",
  },
  blue: {
    light: "oklch(0.45 0.2 250)",
    dark: "oklch(0.6 0.2 250)",
  },
  green: {
    light: "oklch(0.55 0.15 145)",
    dark: "oklch(0.65 0.15 145)",
  },
  purple: {
    light: "oklch(0.5 0.2 290)",
    dark: "oklch(0.65 0.2 290)",
  },
  amber: {
    light: "oklch(0.7 0.15 75)",
    dark: "oklch(0.75 0.15 75)",
  },
  red: {
    light: "oklch(0.55 0.2 25)",
    dark: "oklch(0.65 0.2 25)",
  },
};

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [primaryColor, setPrimaryColor] = React.useState<PrimaryColor>("default");

  React.useEffect(() => {
    // Load primary color from localStorage
    const savedColor = localStorage.getItem("primaryColor") as PrimaryColor;
    if (savedColor && primaryColors[savedColor]) {
      setPrimaryColor(savedColor);
    }
  }, []);

  React.useEffect(() => {
    // Apply primary color to CSS variables
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const colors = primaryColors[primaryColor];
    
    root.style.setProperty("--primary", isDark ? colors.dark : colors.light);
    root.style.setProperty("--sidebar-primary", isDark ? colors.dark : colors.light);
    
    // Save to localStorage
    localStorage.setItem("primaryColor", primaryColor);
  }, [primaryColor]);

  // Listen for theme changes to update primary color
  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const root = document.documentElement;
          const isDark = root.classList.contains("dark");
          const colors = primaryColors[primaryColor];
          root.style.setProperty("--primary", isDark ? colors.dark : colors.light);
          root.style.setProperty("--sidebar-primary", isDark ? colors.dark : colors.light);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [primaryColor]);

  const handleSetPrimaryColor = (color: PrimaryColor) => {
    setPrimaryColor(color);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: "system",
        setTheme: () => {},
        primaryColor,
        setPrimaryColor: handleSetPrimaryColor,
      }}
    >
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

export { primaryColors };
export type { Theme, PrimaryColor };
