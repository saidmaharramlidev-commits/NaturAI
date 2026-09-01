import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApi } from "../../lib/api";

export default function SettingsScreen() {
    const { getMe, updateUsername } = useApi();
    const insets = useSafeAreaInsets();

    const [currentUsername, setCurrentUsername] = useState("");
    const [streak, setStreak] = useState(0);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const loadMe = useCallback(async () => {
        try {
            const res = await getMe();
            setCurrentUsername(res.username);
            setDraft(res.username);
            setStreak(res.streak);
        } catch (err: any) {
            setError(err.message || "Could not load your info");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadMe();
        }, [loadMe])
    );

    const handleSave = async () => {
        const trimmed = draft.trim();

        if (trimmed.length < 3) {
            setError("Username must be at least 3 characters");
            setSuccess(false);
            return;
        }

        if (trimmed === currentUsername) {
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await updateUsername({ username: trimmed });
            setCurrentUsername(res.username);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Could not update username");
        } finally {
            setSaving(false);
        }
    };

    const handleClearSession = () => {
        Alert.alert(
            "Clear session permanently?",
            "This account has no password or recovery option. Once you clear your session, your streak, inbox, and username are gone for good — there's no way back in.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear session",
                    style: "destructive",
                    onPress: async () => {
                        await SecureStore.deleteItemAsync("authToken");
                        router.replace("/(auth)/username");
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#2F6FED" size="large" />
            </View>
        );
    }

    const dirty = draft.trim() !== currentUsername && draft.trim().length > 0;

    return (
        <View className="flex-1 bg-black">
            <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{
                    paddingTop: insets.top + 12,
                    paddingBottom: insets.bottom + 100,
                }}
            >
                <Text className="text-text-primary text-2xl font-extrabold mb-6">
                    Settings
                </Text>

                {/* Identity summary */}
                <View className="rounded-3xl px-6 py-6 mb-6 bg-surface border-2 border-blue">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-full bg-blue items-center justify-center mr-4">
                            <Ionicons name="person" size={20} color="#000000" />
                        </View>
                        <View>
                            <Text className="text-text-dim text-xs font-bold uppercase tracking-[1px]">
                                Signed in as
                            </Text>
                            <Text className="text-text-primary text-lg font-extrabold">
                                {currentUsername}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center mt-4 pt-4 border-t border-surface2">
                        <Ionicons name="flash" size={14} color="#E5384D" />
                        <Text className="text-text-dim text-xs ml-2">
                            {streak} day streak
                        </Text>
                    </View>
                </View>

                {/* Username editor */}
                <Text className="text-text-dim text-xs font-bold uppercase tracking-[2px] mb-3">
                    Username
                </Text>

                <View className="rounded-2xl px-5 py-4 mb-3 border-2 border-surface2 bg-surface">
                    <TextInput
                        value={draft}
                        onChangeText={(text) => {
                            setDraft(text);
                            setSuccess(false);
                            setError(null);
                        }}
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

                {success && (
                    <View className="flex-row items-center mb-3">
                        <View className="w-1.5 h-1.5 rounded-full bg-blue mr-2" />
                        <Text className="text-blue text-sm font-bold">
                            Username updated
                        </Text>
                    </View>
                )}

                <Pressable
                    onPress={handleSave}
                    disabled={!dirty || saving}
                    className={`rounded-2xl py-4 items-center mb-10 ${dirty ? "bg-blue active:bg-blue-dark" : "bg-surface2"
                        }`}
                >
                    {saving ? (
                        <ActivityIndicator color="#000000" />
                    ) : (
                        <Text
                            className={`font-extrabold text-base tracking-wide ${dirty ? "text-black" : "text-text-dim"
                                }`}
                        >
                            SAVE CHANGES
                        </Text>
                    )}
                </Pressable>

                {/* Danger zone */}
                <Text className="text-text-dim text-xs font-bold uppercase tracking-[2px] mb-3">
                    Session
                </Text>

                <View className="rounded-2xl px-5 py-4 mb-3 bg-surface border-l-4 border-red">
                    <Text className="text-text-dim text-xs leading-5">
                        There's no password or recovery for this account. If you clear
                        your session, you lose access to it permanently — your streak,
                        inbox, and username can't be recovered or reassigned. Only do
                        this if you're sure.
                    </Text>
                </View>

                <Pressable
                    onPress={handleClearSession}
                    className="rounded-2xl px-5 py-4 border-2 border-red flex-row items-center justify-between active:opacity-80"
                >
                    <Text className="text-red font-bold text-base">Clear session</Text>
                    <Ionicons name="log-out-outline" size={20} color="#E5384D" />
                </Pressable>
            </ScrollView>
        </View>
    );
}