/**
 * Font family constants for Manrope
 * Maps font weights to the appropriate Manrope font family
 */

export const fonts: {
  family: string;
  weights: {
    extraLight: string;
    light: string;
    regular: string;
    medium: string;
    semiBold: string;
    bold: string;
    extraBold: string;
  };
  getFontFamily: (weight?: keyof typeof fonts.weights) => string;
} = {
  // Font family name
  family: "Manrope",
  
  // Font weight mappings
  weights: {
    extraLight: "Manrope-ExtraLight",
    light: "Manrope-Light",
    regular: "Manrope-Regular",
    medium: "Manrope-Medium",
    semiBold: "Manrope-SemiBold",
    bold: "Manrope-Bold",
    extraBold: "Manrope-ExtraBold",
  },
  
  // Helper function to get font family based on weight
  getFontFamily: (weight: keyof typeof fonts.weights = "regular") => {
    return fonts.weights[weight];
  },
};

