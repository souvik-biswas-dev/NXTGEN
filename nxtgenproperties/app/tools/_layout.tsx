import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="emi-calculator" />
      <Stack.Screen name="budget-calculator" />
      <Stack.Screen name="area-converter" />
      <Stack.Screen name="home-loan" />
      <Stack.Screen name="valuation" />
    </Stack>
  );
}
