import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ScanProductScreen from '../screens/ScanProductScreen';
import VirtualTryOnScreen from '../screens/VirtualTryOnScreen';
import FaceCameraScreen from '../screens/FaceCameraScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            headerLargeTitle: false,
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#fff',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ 
              title: 'Makeup Assistant',
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen
            name="ScanProduct"
            component={ScanProductScreen}
            options={{ 
              title: 'Scan Product',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="VirtualTryOn"
            component={VirtualTryOnScreen}
            options={{ 
              title: 'Virtual Try-On',
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen
            name="FaceCamera"
            component={FaceCameraScreen}
            options={{ 
              title: 'Virtual Try-On',
              headerShown: false, // Fullscreen camera
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

