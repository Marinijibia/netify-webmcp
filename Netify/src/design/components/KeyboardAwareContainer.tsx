import React, { useRef } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

interface KeyboardAwareContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraBottomPadding?: number;
  centerWhenClosed?: boolean;
}

export const KeyboardAwareContainer: React.FC<KeyboardAwareContainerProps> = ({
  children,
  contentContainerStyle,
  extraBottomPadding = 24,
  centerWhenClosed = true,
  ...scrollViewProps
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  const dynamicPaddingBottom = isKeyboardVisible
    ? keyboardHeight + extraBottomPadding
    : extraBottomPadding;

  const dynamicJustifyContent: ViewStyle['justifyContent'] =
    centerWhenClosed && !isKeyboardVisible ? 'center' : 'flex-start';

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1 }}
      contentContainerStyle={[
        {
          flexGrow: 1,
          justifyContent: dynamicJustifyContent,
          paddingBottom: dynamicPaddingBottom,
        },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, justifyContent: dynamicJustifyContent }}>
          {children}
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
};
