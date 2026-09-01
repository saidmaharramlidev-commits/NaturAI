import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotivationCard } from "../../components/MotivationCard";
import { useApi } from "../../lib/api";

const READ_WAIT_SECONDS = 10;

type ContentItem = {
    _id: string;
    text: string;
    type: "quote" | "story";
};

type DailyProgress = {
    _id: string;
    assignedQuote: ContentItem;
    assignedStory: ContentItem;
    quoteSeen: boolean;
    storySeen: boolean;
    roomActivityDone: boolean;
    isDayComplete: boolean;
};

type MeResponse = {
    id: string;
    username: string;
    streak: number;
};

function BackgroundDepth() {
    return (
        <>
            <View className="absolute -top-16 -right-20 w-72 h-72 rounded-full bg-blue opacity-15" />
            <View className="absolute top-96 -left-24 w-60 h-60 rounded-full bg-red opacity-10" />
        </>
    );
}

function StreakBanner({ streak, complete }: { streak: number; complete: boolean }) {
    return (
        <View
            className={`rounded-3xl px-6 py-6 mb-8 border-2 ${complete ? "border-blue bg-surface" : "border-red bg-surface"
                }`}
        >
            <View className="flex-row items-end justify-between">
                <View>
                    <Text className="text-text-dim text-xs font-bold uppercase tracking-[2px] mb-1">
                        Current streak
                    </Text>
                    <Text className="text-text-primary text-6xl font-extrabold">
                        {streak}
                        <Text className="text-2xl text-text-dim font-bold"> days</Text>
                    </Text>
                </View>
                <View
                    className={`w-3 h-3 rounded-full mb-2 ${complete ? "bg-blue" : "bg-red"}`}
                />
            </View>
        </View>
    );
}

function Connector() {
    return (
        <View className="items-center h-6 justify-center">
            <View className="w-0.5 h-full bg-surface2" />
        </View>
    );
}

function TaskCard({
    label,
    done,
    hint,
    onPress,
}: {
    label: string;
    done: boolean;
    hint?: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={done}
            className={`rounded-2xl px-5 py-5 border-2 ${done ? "bg-surface border-blue" : "bg-surface border-surface2 active:border-blue"
                }`}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                    <Text className="text-text-primary text-base font-bold">{label}</Text>
                    {hint && !done && (
                        <Text className="text-text-dim text-xs mt-1">{hint}</Text>
                    )}
                </View>
                <View
                    className={`w-8 h-8 rounded-full items-center justify-center border-2 ${done ? "bg-blue border-blue" : "border-surface2"
                        }`}
                >
                    {done && <Text className="text-black text-sm font-extrabold">✓</Text>}
                </View>
            </View>
        </Pressable>
    );
}

function ContentModal({
    visible,
    title,
    content,
    onClose,
    onMarkSeen,
}: {
    visible: boolean;
    title: string;
    content: ContentItem | null;
    onClose: () => void;
    onMarkSeen: () => Promise<void>;
}) {
    const [secondsLeft, setSecondsLeft] = useState(READ_WAIT_SECONDS);
    const [submitting, setSubmitting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (visible) {
            setSecondsLeft(READ_WAIT_SECONDS);
            timerRef.current = setInterval(() => {
                setSecondsLeft((s) => Math.max(0, s - 1));
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [visible]);

    const handleMarkSeen = async () => {
        setSubmitting(true);
        try {
            await onMarkSeen();
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/80 items-center justify-center px-6">
                <View className="w-full bg-surface rounded-3xl border-2 border-blue px-6 py-7">
                    <Text className="text-blue text-xs font-extrabold uppercase tracking-[2px] mb-3">
                        {title}
                    </Text>

                    <Text className="text-text-primary text-base leading-6 mb-8">
                        "{content?.text}"
                    </Text>

                    <Pressable
                        onPress={handleMarkSeen}
                        disabled={secondsLeft > 0 || submitting}
                        className={`will-change-pressable rounded-2xl py-4 items-center flex-row justify-center active:bg-blue-dark ${secondsLeft > 0 ? "bg-surface2" : "bg-blue"
                            }`}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#000000" />
                        ) : (
                            <>
                                {secondsLeft === 0 && (
                                    <View className="w-2 h-2 rounded-full bg-red mr-3" />
                                )}
                                <Text
                                    className={`font-extrabold text-base tracking-wide ${secondsLeft > 0 ? "text-text-dim" : "text-black"
                                        }`}
                                >
                                    {secondsLeft > 0 ? `WAIT ${secondsLeft}s` : "MARK AS SEEN"}
                                </Text>
                            </>
                        )}
                    </Pressable>

                    {secondsLeft > 0 && (
                        <Pressable onPress={onClose} className="items-center mt-4">
                            <Text className="text-text-dim text-xs">Close</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </Modal>
    );
}

export default function HomeScreen() {
    const { getTodayProgress, getMe, markQuoteSeen, markStorySeen } = useApi();
    const insets = useSafeAreaInsets();

    const [progress, setProgress] = useState<DailyProgress | null>(null);
    const [me, setMe] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<"quote" | "story" | null>(null);

    const loadData = useCallback(async () => {
        setError(null);
        try {
            const [progressRes, meRes] = await Promise.all([
                getTodayProgress(),
                getMe(),
            ]);
            setProgress(progressRes);
            setMe(meRes);
        } catch (err: any) {
            setError(err.message || "Could not load today's tasks");
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleQuoteSeen = async () => {
        const updated = await markQuoteSeen();
        setProgress(updated);
        setMe(await getMe());
    };

    const handleStorySeen = async () => {
        const updated = await markStorySeen();
        setProgress(updated);
        setMe(await getMe());
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
                <Pressable onPress={loadData} className="bg-blue rounded-2xl px-6 py-3">
                    <Text className="text-black font-extrabold">TRY AGAIN</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <BackgroundDepth />

            <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{
                    paddingTop: insets.top + 12,
                    paddingBottom: insets.bottom + 40,
                }}
            >
                <Text className="text-text-primary text-2xl font-extrabold mb-6">
                    Home
                </Text>

                <MotivationCard />

                <StreakBanner
                    streak={me?.streak ?? 0}
                    complete={progress?.isDayComplete ?? false}
                />

                <Text className="text-text-dim text-xs font-bold uppercase tracking-[2px] mb-4">
                    Today's steps
                </Text>

                <TaskCard
                    label="Today's quote"
                    done={progress?.quoteSeen ?? false}
                    hint="Tap to read"
                    onPress={() => setActiveModal("quote")}
                />

                <Connector />

                <TaskCard
                    label="Today's story"
                    done={progress?.storySeen ?? false}
                    hint="Tap to read"
                    onPress={() => setActiveModal("story")}
                />

                <Connector />

                <TaskCard
                    label="Post in a room"
                    done={progress?.roomActivityDone ?? false}
                    hint="Tap to go to Rooms"
                    onPress={() => router.push("/(tabs)/rooms")}
                />
            </ScrollView>

            <ContentModal
                visible={activeModal === "quote"}
                title="Today's quote"
                content={progress?.assignedQuote ?? null}
                onClose={() => setActiveModal(null)}
                onMarkSeen={handleQuoteSeen}
            />

            <ContentModal
                visible={activeModal === "story"}
                title="Today's story"
                content={progress?.assignedStory ?? null}
                onClose={() => setActiveModal(null)}
                onMarkSeen={handleStorySeen}
            />
        </View>
    );
}