// App.tsx
import * as React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Landing from "./src/screens/Landing";
import LeagueHome from "./src/screens/LeagueHome";
import GameDetail from "./src/screens/GameDetail";
import theme from "./src/theme";
import { enableScreens } from "react-native-screens";
enableScreens(false);
export type RootStackParamList = {
  Landing: undefined;
  LeagueHome: { league: "MLB" | "NFL" };
  GameDetail: { gamePk: number; home: string; away: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.bg,
      primary: theme.colors.primary,
      text: theme.colors.text,
      border: "transparent",
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar barStyle="light-content" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={Landing} />
          <Stack.Screen name="LeagueHome" component={LeagueHome} />
          <Stack.Screen name="GameDetail" component={GameDetail} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
