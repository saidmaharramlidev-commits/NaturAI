import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApi } from "../../lib/api";

type Answer = {
    _id: string;
    text: string;
    answeredBy: { username: string } | null;
    createdAt: string;
};

type InboxItemType = {
    _id: string;
    questionText: string;
    answers: Answer[];
    isLiked: boolean;
    createdAt: string;
};

function ExplainerCard() {
    return (
        <View className="rounded-2xl px-5 py-5 mb-6 bg-surface border-l-4 border-blue">
            <Text className="text-blue text-sm font-extrabold uppercase tracking-[1px] mb-2">
                How this works
            </Text>
            <Text className="text-text-dim text-sm leading-5">
                Answers to your questions land here. Unliked items clear out daily —
                tap the heart on anything you want to keep.
            </Text>
        </View>
    );
}

function InboxCard({
    item,
    onToggleLike,
}: {
    item: InboxItemType;
    onToggleLike: (id: string) => void;
}) {

    const { reportContent } = useApi();
    const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

    const handleReportAnswer = (answerId: string) => {
        Alert.alert(
            "Report this answer?",
            "This will hide it from your inbox for review.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Report",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await reportContent("answer", answerId);
                            setReportedIds((prev) => new Set(prev).add(answerId));
                        } catch (err) {
                            // already reported or failed — ignore
                        }
                    },
                },
            ]
        );
    };



    return (
        <View
            className={`rounded-2xl px-5 py-5 mb-4 bg-surface border-2 ${item.isLiked ? "border-blue" : "border-surface2"
                }`}
        >
            <View className="flex-row items-start justify-between mb-3">
                <Text className="text-text-primary text-base font-bold flex-1 pr-3">
                    {item.questionText}
                </Text>
                <Pressable
                    onPress={() => onToggleLike(item._id)}
                    hitSlop={8}
                    className="w-9 h-9 rounded-full items-center justify-center bg-surface2"
                >
                    <Ionicons
                        name={item.isLiked ? "heart" : "heart-outline"}
                        size={18}
                        color={item.isLiked ? "#E5384D" : "#5B739E"}
                    />
                </Pressable>
            </View>

            {item.answers.length === 0 ? (
                <Text className="text-text-dim text-xs italic">
                    No answers yet — check back soon
                </Text>
            ) : (
                <View className="border-t border-surface2 pt-3">
                    <Text className="text-text-dim text-xs font-bold uppercase tracking-[1px] mb-3">
                        {item.answers.length} {item.answers.length === 1 ? "answer" : "answers"}
                    </Text>
                    {item.answers
                        .filter((answer) => !reportedIds.has(answer._id ?? ""))
                        .map((answer, idx) => (
                            <View
                                key={answer._id ?? idx}
                                className="mb-3 last:mb-0 bg-surface2 rounded-xl px-4 py-3"
                            >
                                <View className="flex-row items-start justify-between">
                                    <Text className="text-text-primary text-sm leading-5 flex-1 pr-3">
                                        {answer.text}
                                    </Text>
                                    <Pressable
                                        onPress={() => answer._id && handleReportAnswer(answer._id)}
                                        hitSlop={8}
                                    >
                                        <Ionicons name="flag-outline" size={14} color="#5B739E" />
                                    </Pressable>
                                </View>
                                <Text className="text-text-dim text-xs mt-2">
                                    — {answer.answeredBy?.username ?? "anonymous"}
                                </Text>
                            </View>
                        ))}
                </View>
            )}
        </View>
    );
}

export default function InboxScreen() {
    const { getInbox, likeInboxItem } = useApi();
    const insets = useSafeAreaInsets();

    const [items, setItems] = useState<InboxItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadInbox = useCallback(async () => {
        setError(null);
        try {
            const res = await getInbox();
            setItems(res);
        } catch (err: any) {
            setError(err.message || "Could not load your inbox");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadInbox();
        }, [loadInbox])
    );

    const handleToggleLike = async (id: string) => {
        // optimistic update
        setItems((prev) =>
            prev.map((item) => (item._id === id ? { ...item, isLiked: true } : item))
        );
        try {
            await likeInboxItem(id);
        } catch {
            // revert on failure
            setItems((prev) =>
                prev.map((item) => (item._id === id ? { ...item, isLiked: false } : item))
            );
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadInbox();
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#2F6FED" size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 bg-black items-center justify-center px-6">
                <Text className="text-red text-center font-bold mb-4">{error}</Text>
                <Pressable onPress={loadInbox} className="bg-blue rounded-2xl px-6 py-3">
                    <Text className="text-black font-extrabold">TRY AGAIN</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <FlatList
                data={items}
                keyExtractor={(item) => item._id}
                className="flex-1 px-5"
                contentContainerStyle={{
                    paddingTop: insets.top + 12,
                    paddingBottom: insets.bottom + 100,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#2F6FED"
                    />
                }
                ListHeaderComponent={
                    <>
                        <Text className="text-text-primary text-2xl font-extrabold mb-6">
                            Inbox
                        </Text>
                        <ExplainerCard />
                    </>
                }
                ListEmptyComponent={
                    <View className="items-center py-16">
                        <Ionicons name="mail-open-outline" size={32} color="#5B739E" />
                        <Text className="text-text-dim text-sm mt-3 text-center">
                            No answers yet. Ask something in Rooms to get started.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <InboxCard item={item} onToggleLike={handleToggleLike} />
                )}
            />
        </View>
    );
}