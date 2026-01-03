import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Navigate based on authentication status
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/Login");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Image 
          source={require("../assets/images/diracks.png")} 
          style={styles.logo} 
          resizeMode="contain"
        />
        
        {/* Brand Name */}
        <Text style={styles.brandName}>DIRACKS</Text>
        
        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.green} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  brandName: {
    fontSize: 36,
    fontFamily: fonts.weights.bold,
    color: colors.primary.green,
    letterSpacing: 2,
    marginBottom: 48,
  },
  loadingContainer: {
    marginTop: 24,
  },
});
