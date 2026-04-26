import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Log In',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Sign Up',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="verify-email" 
        options={{ 
          title: 'Verify Email',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
