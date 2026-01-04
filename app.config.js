import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "D-Service",
  slug: "dirackServiceApp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/1024.png",
  scheme: "dirackserviceapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.dirackservice.app",
  },

  android: {
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/images/1024.png",
      backgroundImage: "./assets/images/1024.png",
      monochromeImage: "./assets/images/1024.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.dirackservice.app",
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#ffffff",
        },
      },
    ],
    "@react-native-community/datetimepicker",
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    // ✅ NEXT_PUBLIC_* appended here
    apiDomain: process.env.API_DOMAIN,
    googleKey: process.env.GOOGLE_KEY,

    router: {},
    eas: {
      projectId: "f09326fd-ae94-4810-8851-9b62a4505ddc",
    },
  },
});
