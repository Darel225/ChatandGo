import React from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

export default function ScreenWrapper({ 
  children, 
  style, 
  withKeyboard = false,
  backgroundColor = Colors.background
}) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[
      styles.container, 
      { 
        paddingTop: insets.top, 
        paddingBottom: insets.bottom,
        backgroundColor
      }, 
      style
    ]}>
      {children}
    </View>
  );

  if (withKeyboard) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
