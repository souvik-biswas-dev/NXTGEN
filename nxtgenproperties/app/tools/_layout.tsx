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
    </Stack>
  );
}
