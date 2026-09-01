import { Ionicons } from "@expo/vector-icons";

export type RoomKey = "personal" | "job" | "relationships" | "general";

export type RoomMeta = {
    key: RoomKey;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    accent: string; // border/icon color class
    tint: string; // icon badge background class
};

export const ROOMS: RoomMeta[] = [
    {
        key: "personal",
        label: "Personal",
        description: "Your own struggles, wonders, and reflections",
        icon: "person",
        accent: "border-blue",
        tint: "bg-blue",
    },
    {
        key: "job",
        label: "Job",
        description: "About industry,your work",
        icon: "briefcase",
        accent: "border-blue-dark",
        tint: "bg-blue-dark",
    },
    {
        key: "relationships",
        label: "Relationships",
        description: "Your relation with partner and yourself",
        icon: "heart",
        accent: "border-red",
        tint: "bg-red",
    },
    {
        key: "general",
        label: "General",
        description: "Open talk — no question required",
        icon: "chatbubbles",
        accent: "border-red-dark",
        tint: "bg-red-dark",
    },
];

export function getRoomMeta(key: string): RoomMeta | undefined {
    return ROOMS.find((r) => r.key === key);
}