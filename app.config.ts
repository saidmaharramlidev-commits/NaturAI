import { ExpoConfig } from "expo/config";

const isDevelopment = process.env.APP_VARIANT === "development";


const config: ExpoConfig = {

  name: "NaturAI",
  slug: "naturai",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/app_logo.png",
  scheme: "naturai",
  userInterfaceStyle: "automatic",
  android: {
    versionCode: 1,

    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/app_logo.png",
      backgroundImage: "./assets/app_logo.png",
      monochromeImage: "./assets/app_logo.png"
    },
    predictiveBackGestureEnabled: false,
    package: isDevelopment
      ? "com.saidovery.naturai.dev"
      : "com.saidovery.naturai",
  },
  web: {
    output: "static",
    favicon: "./assets/app_logo.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#011D4D",
        image: "./assets/app_logo.png",
        imageWidth: 76
      }
    ],
    "expo-secure-store"
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  },
  extra: {
    router: {},
    eas: {
      projectId: "fe310148-34bd-43d4-985b-3c921e4f3802"
    }
  },
  owner: "said20072026"
}


export default config;