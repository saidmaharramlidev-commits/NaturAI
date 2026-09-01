import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
    index: { active: "home", inactive: "home-outline" },
    rooms: { active: "chatbubbles", inactive: "chatbubbles-outline" },
    inbox: { active: "mail", inactive: "mail-outline" },
    settings: { active: "settings", inactive: "settings-outline" },
};

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: "#2F6FED",
                tabBarInactiveTintColor: "#5B739E",
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "700",
                },
                tabBarStyle: {
                    position: "absolute",
                    bottom: 24,
                    left: 20,
                    right: 20,
                    height: 68,
                    borderRadius: 28,
                    backgroundColor: "#0D0D12",
                    borderTopWidth: 0,
                    paddingTop: 5,
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                },
                tabBarIcon: ({ focused, color }) => {
                    const icons = ICONS[route.name];
                    const iconName = focused ? icons.active : icons.inactive;
                    return <Ionicons name={iconName} size={22} color={color} />;
                },
            })}
        >
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="rooms" options={{ title: "Rooms" }} />
            <Tabs.Screen name="inbox" options={{ title: "Inbox" }} />
            <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        </Tabs>
    );
}