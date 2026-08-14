import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Styles';

export default function CustomButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  style, 
  textStyle 
}) {
  const isPrimary = variant === 'primary';
  const bgColor = isPrimary ? Colors.primary : Colors.background;
  const textColor = isPrimary ? Colors.background : Colors.primary;
  const borderColor = isPrimary ? 'transparent' : Colors.primary;

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor: bgColor, borderColor, borderWidth: isPrimary ? 0 : 1 },
        isPrimary && GlobalStyles.shadow,
        style
      ]} 
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
    width: '100%',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  }
});
