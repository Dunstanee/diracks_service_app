import Button from "@/components/Button";
import Input from "@/components/Input";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { loginSchema, validateField, validateForm } from "@/validators";
import { router } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login, isAuthenticated, token } = useAuthStore();



  // Validate single field on change
  const handleFieldChange = (field: "username" | "password", value: string) => {
    if (field === "username") {
      setUsername(value);
    } else {
      setPassword(value);
    }

    // Clear errors when user starts typing
    setErrors((prev) => {
      const newErrors = { ...prev };
      // Clear field-specific error
      if (newErrors[field]) {
        delete newErrors[field];
      }
      // Clear general error
      if (newErrors.general) {
        delete newErrors.general;
      }
      return newErrors;
    });

    // Validate field in real-time (optional - can be removed if you only want validation on submit)
    const fieldError = validateField(loginSchema, field, value);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }
  };

  // Login API call
  const handleLogin = async () => {
    // Validate entire form
    const validation = validateForm(loginSchema, { username, password });
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Clear any previous errors
    setErrors({});
    setIsLoading(true);

    try {
      // Make API call to login endpoint
      const response = await api.post(
        "/login",
        {
          emailOrUserNumber: username,
          password: password,
        },
        {
          requiresAuth: false, // Login endpoint doesn't require authentication
        }
      );

      // Handle successful login response
      // API returns: { user, accessToken }
      const { accessToken, user } = response.data;

      if (accessToken && user) {
        // Store authentication data
        // Using accessToken as both token and refreshToken since API only provides accessToken
        login(accessToken, accessToken, user);
        // Permissions will be fetched after account switch
        router.push("/SwitchAccount");
      } else {
        // Handle unexpected response format
        setErrors({ 
          general: "Invalid response from server. Please try again." 
        });
      }
    } catch (error: any) {
      
      // Handle API errors
      const errorMessage = error?.message || error?.data?.message || "Login failed. Please check your credentials and try again.";
      
      // Check if it's a validation error from the API
      if (error?.data?.errors) {
        // If API returns field-specific errors, map them
        setErrors(error.data.errors);
      } else {
        // Otherwise show general error
        setErrors({ 
          general: errorMessage 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerIconContainer}>
              <Image source={require("../assets/images/diracks.png")} style={styles.headerIcon} />
              <Text style={styles.headerIconText}>Diracks</Text>
          </View>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>Let's you sign in</Text>
            <Text style={styles.subtitle}>Welcome back, you have been missed</Text>
          </View>
  
          {/* Form Section */}
          <View style={styles.form}>
            <Input
              label="Username"
              placeholder="username@email.com"
              value={username}
              onChangeText={(text) => handleFieldChange("username", text)}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.username}
            />
  
            <Input
              label="Password"
              placeholder="8 Characters / 1 Capital letter"
              value={password}
              onChangeText={(text) => handleFieldChange("password", text)}
              secureTextEntry
              error={errors.password}
            />
  
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => {}}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <Button
              title="SIGN IN"
              variant="primary"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.signInButton}
            />
          </View>
  
          
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerIconContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      marginBottom: 20,
  },
  headerIcon: {
      width: 32,
      height: 32,
  },
  headerIconText: {
      fontSize: 24,
      fontFamily: fonts.weights.bold,
      color: colors.text.primary,
      marginLeft: 10,
  },
container: {
  flex: 1,
  backgroundColor: colors.background.primary,
},
scrollContent: {
  flexGrow: 1,
  paddingHorizontal: 24,
  paddingTop: 20,
  paddingBottom: 40,
},
header: {
  marginBottom: 40,
},
title: {
  fontSize: 32,
  fontFamily: fonts.weights.bold,
  color: colors.text.primary,
  marginBottom: 8,
},
subtitle: {
  fontSize: 16,
  fontFamily: fonts.weights.regular,
  color: colors.neutral.gray.medium,
},
form: {
  marginBottom: 32,
},
forgotPasswordContainer: {
  alignSelf: "flex-end",
  marginBottom: 24,
  marginTop: -8,
},
forgotPasswordText: {
  fontSize: 14,
  fontFamily: fonts.weights.medium,
  color: colors.primary.green,
},
signInButton: {
  marginBottom: 16,
},
errorContainer: {
  marginBottom: 16,
  padding: 12,
  backgroundColor: "#FEE2E2",
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.semantic.error,
},
errorText: {
  fontSize: 14,
  fontFamily: fonts.weights.medium,
  color: colors.semantic.error,
  textAlign: "center",
},
footer: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginTop: "auto",
  paddingTop: 24,
},
footerText: {
  fontSize: 14,
  fontFamily: fonts.weights.regular,
  color: colors.text.primary,
},
footerLink: {
  fontSize: 14,
  fontFamily: fonts.weights.semiBold,
  color: colors.primary.green,
},
});
