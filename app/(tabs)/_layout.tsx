import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const Layout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text.inverse,
        tabBarInactiveTintColor: colors.neutral.gray.medium,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              iconName="home"
              iconNameFocused="home"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Services"
        options={{
          title: 'Services',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              iconName="grid-outline"
              iconNameFocused="grid"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Branches"
        options={{
          title: 'Branches',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              iconName="business-outline"
              iconNameFocused="business"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              iconName="chatbubbles-outline"
              iconNameFocused="chatbubbles"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              iconName="person-outline"
              iconNameFocused="person"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
};

// Custom Tab Icon Component with background for focused state
interface TabIconProps {
  focused: boolean;
  iconName: string;
  iconNameFocused: string;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({
  focused,
  iconName,
  iconNameFocused,
  color,
  size,
}) => {
  const iconSize = focused ? 24 : 22;
  const iconColor = focused ? colors.text.inverse : colors.neutral.gray.medium;

  if (focused) {
    return (
      <View style={styles.iconContainer}>
        <Ionicons
          name={iconNameFocused as any}
          size={iconSize}
          color={iconColor}
        />
      </View>
    );
  }

  return (
    <Ionicons
      name={iconName as any}
      size={iconSize}
      color={iconColor}
    />
  );
};

export default Layout;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 70 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarIcon: {
    marginTop: 0,
  },
  iconContainer: {
    backgroundColor: colors.primary.green,
    borderRadius: 14,
    paddingHorizontal: 15,
    minWidth: 70,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary.green,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
});
