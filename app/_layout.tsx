import { Stack, router, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { useApi } from "../lib/api";

function RootLayoutContent() {
    const [checkingAuth, setCheckingAuth] = useState(true);
    const segments = useSegments();
    const { getMe } = useApi();

    useEffect(() => {
        const checkToken = async () => {
            const token = await SecureStore.getItemAsync("authToken");
            const inAuthGroup = segments[0] === "(auth)";

            if (!token) {
                if (!inAuthGroup) router.replace("/(auth)/username" as any);
                setCheckingAuth(false);
                return;
            }

            // Token exists — confirm it still points to a real user
            try {
                await getMe();
                if (inAuthGroup) router.replace("/(tabs)");
            } catch (err) {
                // Token is stale/invalid (user deleted, expired, etc.) — clear it
                await SecureStore.deleteItemAsync("authToken");
                if (!inAuthGroup) router.replace("/(auth)/username" as any);
            }

            setCheckingAuth(false);
        };

        checkToken();
    }, [segments]);

    if (checkingAuth) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#2F6FED" size="large" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#000000" },
            }}
        >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <RootLayoutContent />
        </SafeAreaProvider>
    );
}