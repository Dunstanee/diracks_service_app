import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from 'react-native-safe-area-context';

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 10000,
  fade: true,
});
export default function RootLayout() {
  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.darkAccent }}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background.accent,
            },
            headerTintColor: colors.text.inverse,
            headerTitleStyle: {
              fontFamily: fonts.weights.bold,
            },
          }}
        >
          <Stack.Screen name="index"   options={{  headerShown: false }} />
          <Stack.Screen name="Login" options={{ headerShown: false }} />
          <Stack.Screen name="SwitchAccount" options={{ headerShown: false }} />
          <Stack.Screen name="ChangePassword" options={{ headerShown: false }} />
          <Stack.Screen name="UpdateProfile" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="NewService" options={{ headerShown: false }} />
          <Stack.Screen name="ServiceDetails" options={{ headerShown: false }} />
          <Stack.Screen name="EditService" options={{
            headerShown: false,
            title: 'Update Service',
            headerStyle: { backgroundColor: colors.background.accent },
            headerTintColor: colors.text.inverse,
            headerTitleStyle: {
              fontFamily: fonts.weights.bold,
              color: colors.text.inverse,
            },
          }} />
          <Stack.Screen name="BranchDetails" options={{ headerShown: false }} />
          <Stack.Screen name="ServiceDetailsSummary" options={{ headerShown: false }} />
          <Stack.Screen name="SubscriptionPlans" options={{ headerShown: false }} />
          <Stack.Screen name="Staffs" options={{ headerShown: false }} />
          <Stack.Screen name="ViewStaff" options={{ headerShown: false }} />
          <Stack.Screen name="IncomingRequestList" options={{ headerShown: false }} />
          <Stack.Screen name="IncomingRequestDetails" options={{ headerShown: false }} />
          <Stack.Screen name="ChatRoom" options={{ headerShown: false }} />
          <Stack.Screen name="FinanceBreakSummary" options={{ title: 'Finance Break Summary', headerShown: false }} />
          <Stack.Screen name="BookingHistory" options={{ title: 'Booking History', headerShown: false }} />  
          <Stack.Screen name="InvoiceHistory" options={{ title: 'Invoice History', headerShown: false }} />
          <Stack.Screen name="Notification" options={{ title: 'Notifications', headerShown: false }} />
        </Stack>
      </SafeAreaView>
      <StatusBar style="light" />
    </>
  );
}
