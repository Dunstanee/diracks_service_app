import { colors } from '@/constants/colors';
import { fonts } from '@/constants/fonts';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from 'react-native-safe-area-context';


export default function RootLayout() {
  return (
    <>
      <SafeAreaView style={{ flex: 1 }} edges={[ 'bottom','left','right']} >
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background.darkAccent,
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
          <Stack.Screen name="ChangePassword" options={{ title: 'Change Password' }} />
          <Stack.Screen name="UpdateProfile" options={{ title: 'Update Profile' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="NewService" options={{ title: 'New Service' }} />
          <Stack.Screen name="ServiceDetails" options={{ title: 'Service Details' }} />
          <Stack.Screen name="EditService" options={{
            headerShown: false,
            title: 'Update Service',
            headerStyle: { backgroundColor: colors.background.darkAccent },
            headerTintColor: colors.text.inverse,
            headerTitleStyle: {
              fontFamily: fonts.weights.bold,
              color: colors.text.inverse,
            },
          }} />
          <Stack.Screen name="BranchDetails" options={{ title: 'Branch Details' }} />
          <Stack.Screen name="ServiceDetailsSummary" options={{ title: 'Service Details Summary' }} />
            <Stack.Screen name="Staffs" options={{ title: 'Staffs' }} />
          <Stack.Screen name="ViewStaff" options={{ title: 'View Staff' }} />
          <Stack.Screen name="IncomingRequestList" options={{ title: 'Incoming Request List' }} />
          <Stack.Screen name="IncomingRequestDetails" options={{ title: 'Incoming Request Details' }} />
          <Stack.Screen name="ChatRoom" options={{ title: 'Chat Room' }} />
          <Stack.Screen name="FinanceBreakSummary" options={{ title: 'Finance Break Summary' }} />
          <Stack.Screen name="BookingHistory" options={{ title: 'Booking History' }} />  
          <Stack.Screen name="InvoiceHistory" options={{ title: 'Invoice History' }} />
          <Stack.Screen name="Notification" options={{ title: 'Notifications' }} />
          <Stack.Screen name="PrivacyPolicy" options={{ title: 'Privacy Policy' }} />
        </Stack>
      </SafeAreaView>
      <StatusBar  style="auto" backgroundColor={colors.background.darkAccent}  />
    </>
  );
}
