import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApi } from "../../../lib/api";
import { getRoomMeta } from "../../../lib/roomsMeta";

const DAILY_LIMIT = 3;

type Message = {
    _id: string;
    text: string;
    type: "question" | "general";
    postedBy: { username: string } | null;
    answerCount: number;
    createdAt: string;
};

type Answer = {
    _id: string;
    text: string;
    answeredBy: { username: string } | null;
    createdAt: string;
};

function isToday(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
    );
}

function AnswersSection({
    message,
    onAnswered,
    isMine,
}: {
    message: Message;
    onAnswered: () => void;
    isMine: boolean;
}) {
    const { postAnswer } = useApi();
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!draft.trim()) return;
        setSending(true);
        setError(null);
        try {
            await postAnswer(message._id, draft.trim());
            setDraft("");
            onAnswered();
        } catch (err: any) {
            setError(err.message || "Could not post your answer");
        } finally {
            setSending(false);
        }
    };

    const atCap = message.answerCount >= 5;

    if (isMine) {
        return (
            <View className="mt-3 pt-3 border-t border-surface2">
                <Text className="text-text-dim text-xs italic">
                    Check your Inbox for answers to this question
                </Text>
            </View>
        );
    }

    return (
        <View className="mt-3 pt-3 border-t border-surface2">
            {atCap ? (
                <Text className="text-text-dim text-xs italic mt-1">
                    This question has reached the answer limit
                </Text>
            ) : (
                <View className="flex-row items-center mt-2">
                    <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="Write a reply..."
                        placeholderTextColor="#5B739E"
                        className="flex-1 bg-surface2 rounded-xl px-4 py-3 text-text-primary text-sm mr-2"
                        multiline
                    />
                    <Pressable
                        onPress={handleSubmit}
                        disabled={sending || !draft.trim()}
                        className={`w-10 h-10 rounded-full items-center justify-center ${draft.trim() ? "bg-blue" : "bg-surface2"
                            }`}
                    >
                        {sending ? (
                            <ActivityIndicator color="#000000" size="small" />
                        ) : (
                            <Ionicons
                                name="arrow-up"
                                size={18}
                                color={draft.trim() ? "#000000" : "#5B739E"}
                            />
                        )}
                    </Pressable>
                </View>
            )}

            {error && (
                <Text className="text-red text-xs font-semibold mt-2">{error}</Text>
            )}
        </View>
    );
}

function MessageCard({
    message,
    expanded,
    onToggle,
    onAnswered,
    accent,
    isMine,
}: {
    message: Message;
    expanded: boolean;
    onToggle: () => void;
    onAnswered: () => void;
    accent: string;
    isMine: boolean;
}) {
    const isQuestion = message.type === "question";
    const borderColor = isMine ? "border-blue" : "border-red";

    const { reportContent } = useApi();
    const [reported, setReported] = useState(false);
    const [reporting, setReporting] = useState(false);

    const handleReport = () => {
        Alert.alert(
            "Report this post?",
            "This will flag it for review. If enough people report it, it'll be hidden automatically.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Report",
                    style: "destructive",
                    onPress: async () => {
                        setReporting(true);
                        try {
                            await reportContent("message", message._id);
                            setReported(true);
                        } catch (err) {
                            // already reported or network issue — fail silently, button just won't re-enable
                        } finally {
                            setReporting(false);
                        }
                    },
                },
            ]
        );
    };

    const CardInner = (
        <View className={`rounded-2xl px-5 py-4 mb-4 bg-surface border ${borderColor}`}>
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-text-dim text-xs font-bold">
                    {isMine ? "You" : message.postedBy?.username ?? "anonymous"}
                </Text>
                <View className="flex-row items-center">
                    {isQuestion && (
                        <View className={`flex-row items-center px-3 py-1.5 rounded-full mr-2 ${isMine ? "bg-surface2" : accent}`}>
                            <Ionicons name="chatbubble-ellipses" size={12} color={isMine ? "#5B739E" : "#000000"} />
                            <Text className={`text-xs font-extrabold ml-1.5 ${isMine ? "text-text-dim" : "text-black"}`}>
                                {message.answerCount >= 5
                                    ? "FULL · 5/5"
                                    : isMine
                                        ? `${message.answerCount}/5 ANSWERS`
                                        : `TAP TO ANSWER · ${message.answerCount}/5`}
                            </Text>
                        </View>
                    )}
                    {!isMine && (
                        <Pressable onPress={handleReport} disabled={reported || reporting} hitSlop={8}>
                            <Ionicons
                                name={reported ? "flag" : "flag-outline"}
                                size={16}
                                color={reported ? "#E5384D" : "#5B739E"}
                            />
                        </Pressable>
                    )}
                </View>
            </View>

            <Text className="text-text-primary text-sm leading-5">{message.text}</Text>

            {isQuestion && expanded && (
                <AnswersSection message={message} onAnswered={onAnswered} isMine={isMine} />
            )}
        </View>
    );

    if (!isQuestion) return CardInner;



    return (
        <Pressable onPress={onToggle}>
            {CardInner}
        </Pressable>
    );
}

export default function RoomChatScreen() {
    const { room } = useLocalSearchParams<{ room: string }>();
    const { getRoomMessages, getMe, postRoomMessage } = useApi();
    const insets = useSafeAreaInsets();
    const meta = getRoomMeta(room ?? "");

    const [messages, setMessages] = useState<Message[]>([]);
    const [myUsername, setMyUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const loadRoom = useCallback(async () => {
        if (!room) return;
        setError(null);
        try {
            const [msgs, me] = await Promise.all([getRoomMessages(room), getMe()]);
            setMessages(msgs);
            setMyUsername(me.username);
        } catch (err: any) {
            setError(err.message || "Could not load this room");
        } finally {
            setLoading(false);
        }
    }, [room]);

    useFocusEffect(
        useCallback(() => {
            loadRoom();
        }, [loadRoom])
    );

    const postsTodayMine = messages.filter(
        (m) => m.postedBy?.username === myUsername && isToday(m.createdAt)
    ).length;
    const remaining = Math.max(0, DAILY_LIMIT - postsTodayMine);

    const handleSend = async () => {
        if (!draft.trim() || !room) return;
        setSending(true);
        setSendError(null);
        try {
            await postRoomMessage(room, draft.trim());
            setDraft("");
            await loadRoom();
        } catch (err: any) {
            setSendError(err.message || "Could not post your message");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#2F6FED" size="large" />
            </View>
        );
    }

    if (error || !meta) {
        return (
            <View className="flex-1 bg-black items-center justify-center px-6">
                <Text className="text-red text-center font-bold mb-4">
                    {error || "Room not found"}
                </Text>
                <Pressable onPress={() => router.back()} className="bg-blue rounded-2xl px-6 py-3">
                    <Text className="text-black font-extrabold">GO BACK</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <View style={{ paddingTop: insets.top + 12 }} className="flex-row items-center px-5 pb-4">
                <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3">
                    <Ionicons name="arrow-back" size={22} color="#5B739E" />
                </Pressable>
                <Text className="text-text-primary text-xl font-extrabold flex-1">
                    {meta.label}
                </Text>
                <Text className="text-text-dim text-xs font-bold">
                    {remaining}/{DAILY_LIMIT} left today
                </Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item._id}
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <View className="items-center py-16">
                        <Ionicons name="chatbubbles-outline" size={32} color="#5B739E" />
                        <Text className="text-text-dim text-sm mt-3 text-center">
                            No posts yet. Be the first to share something.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <MessageCard
                        message={item}
                        expanded={expandedId === item._id}
                        onToggle={() =>
                            setExpandedId((cur) => (cur === item._id ? null : item._id))
                        }
                        onAnswered={loadRoom}
                        accent={meta.tint}
                        isMine={item.postedBy?.username === myUsername}
                    />
                )}
            />

            <View
                style={{
                    marginBottom: keyboardHeight > 0 ? keyboardHeight + 12 : insets.bottom + 104,
                }}
                className="mx-5 bg-surface rounded-2xl border-2 border-surface2 px-4 py-3"
            >
                {remaining === 0 ? (
                    <Text className="text-text-dim text-sm text-center py-2">
                        You've used all your posts for this room today
                    </Text>
                ) : (
                    <>
                        <View className="flex-row items-center">
                            <TextInput
                                value={draft}
                                onChangeText={setDraft}
                                placeholder={
                                    meta.key === "general" ? "Share something..." : "Ask a question..."
                                }
                                placeholderTextColor="#5B739E"
                                className="flex-1 text-text-primary text-sm mr-2"
                                multiline
                                maxLength={500}
                            />
                            <Pressable
                                onPress={handleSend}
                                disabled={sending || !draft.trim()}
                                className={`w-10 h-10 rounded-full items-center justify-center ${draft.trim() ? "bg-blue" : "bg-surface2"
                                    }`}
                            >
                                {sending ? (
                                    <ActivityIndicator color="#000000" size="small" />
                                ) : (
                                    <Ionicons
                                        name="arrow-up"
                                        size={18}
                                        color={draft.trim() ? "#000000" : "#5B739E"}
                                    />
                                )}
                            </Pressable>
                        </View>
                        {sendError && (
                            <Text className="text-red text-xs font-semibold mt-2">{sendError}</Text>
                        )}
                    </>
                )}
            </View>
        </View>
    );
}