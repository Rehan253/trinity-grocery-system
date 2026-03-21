import { StyleSheet, Text, type TextProps } from 'react-native';

import { useAccessibilitySettings } from '@/hooks/use-accessibility-settings';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const { fontScale, boldText } = useAccessibilitySettings();

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        {
          fontSize: getScaledValue(type, "fontSize", fontScale),
          lineHeight: getScaledValue(type, "lineHeight", fontScale),
          fontWeight: boldText ? '700' : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});

function getScaledValue(
  type: NonNullable<ThemedTextProps['type']>,
  key: 'fontSize' | 'lineHeight',
  scale: number,
) {
  const styleForType = styles[type];
  const baseValue = styleForType?.[key];
  return typeof baseValue === 'number' ? Math.round(baseValue * scale) : undefined;
}
