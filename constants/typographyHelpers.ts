import { StyleSheet, TextStyle } from 'react-native';
import { Typography } from './theme';

/**
 * Creates properly typed text styles from theme typography
 * Ensures fontFamily, fontSize, fontWeight, etc. are correctly applied
 */
export function createTypographyStyles() {
  return StyleSheet.create({
    display: Typography.styles.display as TextStyle,
    heading: Typography.styles.heading as TextStyle,
    subheading: Typography.styles.subheading as TextStyle,
    body: Typography.styles.body as TextStyle,
    bodyBold: Typography.styles.bodyBold as TextStyle,
    caption: Typography.styles.caption as TextStyle,
    button: Typography.styles.button as TextStyle,
  });
}

/**
 * Merges theme typography style with additional overrides
 * Usage: { ...getTextStyle('heading'), color: '#fff' }
 */
export function getTextStyle(styleType: keyof typeof Typography.styles) {
  return Typography.styles[styleType] as TextStyle;
}
