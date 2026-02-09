import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import TrainingScreen from '../screens/TrainingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type AppStackParamList = {
  Home: undefined;
  Training: { sessionId?: string };
  Results: { sessionId: string };
  Settings: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();

/**
 * AppStack
 * 
 * Main application navigation stack for authenticated users.
 * Contains all primary app screens.
 */
const AppStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'STEPFLOW' }}
      />
      <Stack.Screen 
        name="Training" 
        component={TrainingScreen}
        options={{ title: 'Training Session' }}
      />
      <Stack.Screen 
        name="Results" 
        component={ResultsScreen}
        options={{ title: 'Session Results' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
