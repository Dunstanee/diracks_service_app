import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../constants/colors";
import { fonts } from "../constants/fonts";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value?: string | number;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
}

export default function Select({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  error,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  const borderColor = error
    ? colors.semantic.error
    : isFocused
    ? colors.primary.green
    : colors.neutral.gray.lighter;

  const handleSelect = (optionValue: string | number) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectContainer, { borderColor }]}
        onPress={() => {
          setIsOpen(true);
          setIsFocused(true);
        }}
      >
        <Text
          style={[
            styles.selectText,
            !selectedOption && styles.placeholderText,
          ]}
        >
          {displayText}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.neutral.gray.medium}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsOpen(false);
          setIsFocused(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsOpen(false);
            setIsFocused(false);
          }}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    value === item.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === item.value && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {value === item.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary.green}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
    marginBottom: 8,
  },
  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 52,
    backgroundColor: colors.background.primary,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.neutral.gray.medium,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.semantic.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    width: "80%",
    maxHeight: "60%",
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray.lighter,
  },
  selectedOption: {
    backgroundColor: colors.neutral.gray.lightest,
  },
  optionText: {
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.primary,
  },
  selectedOptionText: {
    fontFamily: fonts.weights.medium,
    color: colors.primary.green,
  },
});

