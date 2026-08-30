import { Tabs } from 'expo-router';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#3B82F6', // blue
                tabBarInactiveTintColor: '#6B7280', // muted gray
                tabBarStyle: {
                    backgroundColor: '#000000', // black
                    borderTopColor: '#1F1F1F',
                },
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="rooms" options={{ title: 'Rooms' }} />
            <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
            <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        </Tabs>
    );
}