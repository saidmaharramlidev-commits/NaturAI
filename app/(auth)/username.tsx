import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApi } from "../../lib/api";

export default function UsernameScreen() {
    const { createMe } = useApi();
    const [username, setUsername] = useState("");
    const [focused, setFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        const trimmed = username.trim();

        if (trimmed.length < 3) {
            setError("Username must be at least 3 characters");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await createMe({ username: trimmed });
            await SecureStore.setItemAsync("authToken", res.token);
            router.replace("/(tabs)");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-black p-3">
            {/* Depth layer — large soft color blocks behind content, not flat black void */}
            <View className="absolute -top-20 -right-24 w-80 h-80 rounded-full bg-blue opacity-20" />
            <View className="absolute top-40 -left-28 w-64 h-64 rounded-full bg-red opacity-10" />
            <View className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue opacity-10" />

            <SafeAreaView className="flex-1 px-6 justify-center" edges={["top", "bottom"]}>
                {/* Bold two-color mark instead of a flat square */}
                <View className="w-16 h-16 rounded-2xl bg-blue items-center justify-center mb-8 shadow-lg">
                    <View className="w-4 h-4 rounded-full bg-red" />
                </View>

                <Text className="text-red text-xs font-extrabold uppercase tracking-[3px] mb-3">
                    You're joining people with same mind
                </Text>

                <Text className="text-blue text-4xl font-extrabold mb-3 leading-[40px]">
                    AI is a tool,not a pARTner
                </Text>

                <Text className="text-text-dim text-sm mb-10 leading-5">
                    No email, no photo, no profile — just a name the community sees
                    when you post. Everyone here has same mindset with you.
                    You can change it anytime in Settings.
                </Text>

                <View
                    className={`rounded-2xl px-5 py-4 mb-3 border-2 ${focused ? "border-blue bg-surface2" : "border-surface2 bg-surface"
                        }`}
                >
                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="username"
                        placeholderTextColor="#5B739E"
                        autoCapitalize="none"
                        autoCorrect={false}
                        className="text-text-primary text-base font-semibold"
                    />
                </View>

                {error && (
                    <View className="flex-row items-center mb-3">
                        <View className="w-1.5 h-1.5 rounded-full bg-red mr-2" />
                        <Text className="text-red text-sm font-bold">{error}</Text>
                    </View>
                )}

                <Pressable
                    onPress={handleSubmit}
                    disabled={loading}
                    className="bg-blue rounded-2xl py-4 items-center active:bg-blue-dark mt-2 flex-row justify-center shadow-lg"
                >
                    {loading ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <>
                            <View className="w-2 h-2 rounded-full bg-red mr-3" />
                            <Text className="text-black font-extrabold text-base tracking-wide">
                                START MY STREAK
                            </Text>
                        </>
                    )}
                </Pressable>


            </SafeAreaView>
        </View>
    );
}