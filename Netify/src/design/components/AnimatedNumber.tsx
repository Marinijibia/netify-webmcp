import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  /** Final numeric value to display */
  value: number;
  /** Duration of the count-up animation in milliseconds */
  duration?: number;
  /** Style applied to the Text */
  style?: TextStyle;
  /** Format function — receives the animated integer, returns display string */
  format?: (n: number) => string;
}

/**
 * Animates a number counting up from 0 to `value` on mount.
 * Re-animates whenever `value` changes.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  style,
  format,
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayRef = useRef('0');

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false, // Value interpolation requires JS thread
    }).start();
  }, [value]);

  // Listen to the animated value and format it
  const [displayText, setDisplayText] = React.useState(
    format ? format(0) : '0'
  );

  useEffect(() => {
    const id = animatedValue.addListener(({ value: v }) => {
      const rounded = Math.round(v);
      setDisplayText(format ? format(rounded) : String(rounded));
    });
    return () => animatedValue.removeListener(id);
  }, [animatedValue, format]);

  return <Text style={style}>{displayText}</Text>;
}
