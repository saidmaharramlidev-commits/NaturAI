import * as SecureStore from "expo-secure-store";

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api`;

export const useApi = () => {
    const request = async (
        endpoint: string,
        options: RequestInit = {},
        requireAuth: boolean = true
    ) => {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string> | undefined),
        };

        if (requireAuth) {
            const token = await SecureStore.getItemAsync("authToken");

            if (!token) {
                console.log("No token available for:", endpoint);
                throw new Error("Not authenticated");
            }

            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(
                "API Error:",
                response.status,
                endpoint,
                JSON.stringify(data)
            );

            const err = new Error(
                data.message || data.error || "Something went wrong"
            ) as Error & { status?: number };

            err.status = response.status;

            throw err;
        }

        return data;
    };

    // ── User ──────────────────────────────────────

    // No token exists yet at signup — must skip auth
    const createMe = (body: { username: string }) =>
        request(
            "/users",
            {
                method: "POST",
                body: JSON.stringify(body),
            },
            false
        );

    const getMe = () => request("/users/me");

    const updateUsername = (body: { username: string }) =>
        request("/users/username", {
            method: "PATCH",
            body: JSON.stringify(body),
        });

    // ── Rooms ────────────────────────────────────

    const postRoomMessage = (room: string, text: string) =>
        request("/rooms", {
            method: "POST",
            body: JSON.stringify({ room, text }),
        });

    const getRoomMessages = (room: string) => request(`/rooms/${room}`);

    // ── Inbox ──────────────────────────────────

    const getInbox = () => request("/inbox");

    const likeInboxItem = (id: string) =>
        request(`/inbox/${id}/like`, {
            method: "PATCH",
        });

    // ── Daily Progress ───────────────────────────────────

    const getTodayProgress = () => request("/daily/today");

    const markQuoteSeen = () =>
        request("/daily/quote-seen", {
            method: "POST",
        });

    const markStorySeen = () =>
        request("/daily/story-seen", {
            method: "POST",
        });

    // ── Answers ───────────────────────────────────

    const getAnswersForQuestion = (questionId: string) =>
        request(`/answers/${questionId}`);

    const postAnswer = (questionId: string, text: string) =>
        request("/answers", {
            method: "POST",
            body: JSON.stringify({ questionId, text }),
        });


    const getStats = () => request("/stats", {}, false);

    const recoverAccount = (body: { username: string; recoveryCode: string }) =>
        request("/users/recover", { method: "POST", body: JSON.stringify(body) }, false);

    const reportContent = (targetType: "message" | "answer", targetId: string) =>
        request("/reports", {
            method: "POST",
            body: JSON.stringify({ targetType, targetId }),
        });

    return {
        createMe,
        getMe,
        updateUsername,
        postRoomMessage,
        getRoomMessages,
        getInbox,
        likeInboxItem,
        getTodayProgress,
        markQuoteSeen,
        markStorySeen,
        getAnswersForQuestion,
        postAnswer,
        getStats,
        recoverAccount,
        reportContent,
    };
};