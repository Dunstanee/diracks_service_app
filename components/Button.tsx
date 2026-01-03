import React from "react";
import { ActivityIndicator, Text, TextStyle, TouchableOpacity, ViewStyle } from "react-native";
import { colors } from "../constants/colors";
import { fonts } from "../constants/fonts";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "text" | "danger" | "outline-danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.neutral.gray.light : colors.primary.green,
        };
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: disabled ? colors.neutral.gray.light : colors.secondary.orange,
        };
      case "outline":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: disabled ? colors.neutral.gray.light : colors.primary.green,
        };
      case "text":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
      case "danger":
        return {
          ...baseStyle,
          backgroundColor: colors.semantic.error,
        };
      case "outline-danger":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: colors.semantic.error,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 16,
      fontFamily: fonts.weights.bold,
      letterSpacing: 1,
    };

    switch (variant) {
      case "primary":
      case "secondary":
        return {
          ...baseStyle,
          color: colors.text.inverse,
        };
      case "outline":
        return {
          ...baseStyle,
          color: disabled ? colors.neutral.gray.light : colors.primary.green,
        };
      case "text":
        return {
          ...baseStyle,
          fontFamily: fonts.weights.semiBold,
          color: disabled ? colors.neutral.gray.light : colors.primary.green,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "secondary" ? colors.text.inverse : colors.primary.green}
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle, { color: variant === "outline-danger" ? colors.semantic.error : colors.text.inverse }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

