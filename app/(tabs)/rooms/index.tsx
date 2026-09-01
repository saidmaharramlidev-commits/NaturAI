import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApi } from "../../../lib/api";
import { ROOMS } from "../../../lib/roomsMeta";

function CommunityBanner({ count, loading }: { count: number | null; loading: boolean }) {
    return (
        <View className="rounded-3xl px-6 py-6 mb-6 bg-surface border-2 border-blue">
            <View className="flex-row items-center justify-between">
                <View>
                    <Text className="text-text-dim text-xs font-bold uppercase tracking-[2px] mb-1">
                        Community
                    </Text>
                    {loading ? (
                        <ActivityIndicator color="#2F6FED" />
                    ) : (
                        <Text className="text-text-primary text-4xl font-extrabold">
                            {count?.toLocaleString() ?? 0}
                        </Text>
                    )}
                    <Text className="text-text-dim text-xs mt-1">people thinks same as you</Text>
                </View>
                <View className="w-12 h-12 rounded-full bg-blue items-center justify-center">
                    <Ionicons name="people" size={22} color="#000000" />
                </View>
            </View>
        </View>
    );
}

function HowItWorksCard() {
    return (
        <View className="rounded-2xl px-5 py-5 mb-6 bg-surface border-l-4 border-red">
            <Text className="text-red text-sm font-extrabold uppercase tracking-[1px] mb-2">
                How rooms work
            </Text>
            <Text className="text-text-dim text-sm leading-5">
                You get 3 posts a day, per room. Find solutions to problems or just share your thoughts with real people instad of AI - others can respond, and answers land privately in your Inbox.

            </Text>
        </View>
    );
}

function RoomCard({
    room,
    onPress,
}: {
    room: (typeof ROOMS)[number];
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`rounded-2xl px-5 py-5 mb-4 bg-surface border-2 ${room.accent} active:opacity-80`}
        >
            <View className="flex-row items-center">
                <View className={`w-11 h-11 rounded-full items-center justify-center mr-4 ${room.tint}`}>
                    <Ionicons name={room.icon} size={20} color="#000000" />
                </View>
                <View className="flex-1">
                    <Text className="text-text-primary text-lg font-extrabold">
                        {room.label}
                    </Text>
                    <Text className="text-text-dim text-xs mt-0.5">{room.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#5B739E" />
            </View>
        </Pressable>
    );
}

export default function RoomsIndexScreen() {
    const { getStats } = useApi();
    const insets = useSafeAreaInsets();
    const [count, setCount] = useState<number | null>(null);
    const [loadingCount, setLoadingCount] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            setLoadingCount(true);
            getStats()
                .then((res: { communityCount: number }) => {
                    if (!cancelled) setCount(res.communityCount);
                })
                .catch(() => {
                    if (!cancelled) setCount(null);
                })
                .finally(() => {
                    if (!cancelled) setLoadingCount(false);
                });
            return () => {
                cancelled = true;
            };
        }, [])
    );

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
                    Rooms
                </Text>

                <CommunityBanner count={count} loading={loadingCount} />

                <HowItWorksCard />

                {ROOMS.map((room) => (
                    <RoomCard
                        key={room.key}
                        room={room}
                        onPress={() => router.push(`/(tabs)/rooms/${room.key}` as any)}
                    />
                ))}
            </ScrollView>
        </View>
    );
}