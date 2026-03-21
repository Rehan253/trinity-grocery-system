import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type FontSizeOption = "small" | "default" | "large";

type AccessibilitySettingsContextValue = {
  fontSize: FontSizeOption;
  fontScale: number;
  boldText: boolean;
  setFontSize: (value: FontSizeOption) => void;
  setBoldText: (value: boolean) => void;
};

const FONT_SCALE_MAP: Record<FontSizeOption, number> = {
  small: 0.9,
  default: 1,
  large: 1.15,
};

const AccessibilitySettingsContext = createContext<
  AccessibilitySettingsContextValue | undefined
>(undefined);

export function AccessibilitySettingsProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSizeOption>("default");
  const [boldText, setBoldText] = useState(false);

  const value = useMemo(
    () => ({
      fontSize,
      fontScale: FONT_SCALE_MAP[fontSize],
      boldText,
      setFontSize,
      setBoldText,
    }),
    [fontSize, boldText],
  );

  return (
    <AccessibilitySettingsContext.Provider value={value}>
      {children}
    </AccessibilitySettingsContext.Provider>
  );
}

export function useAccessibilitySettings() {
  const context = useContext(AccessibilitySettingsContext);

  if (!context) {
    throw new Error(
      "useAccessibilitySettings must be used within AccessibilitySettingsProvider",
    );
  }

  return context;
}
