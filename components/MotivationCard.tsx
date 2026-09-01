import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function MotivationCard() {
    return (
        <View className="rounded-2xl px-5 py-5 mb-6 bg-surface border-l-4 border-blue">
            <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-blue items-center justify-center mr-3">
                    <Ionicons name="flash" size={16} color="#000000" />
                </View>
                <Text className="text-blue text-sm font-extrabold uppercase tracking-[1px]">
                    Why streaks matter
                </Text>
            </View>
            <Text className="text-text-dim text-sm leading-5">
                Every day you see AI as tool,and it prevents possible future problems as addiction,being asocial or becoming person who has brain without functionality.Improve yourself with stories,quotes about it eveyday and remain as human,not product
            </Text>
        </View>
    );
}