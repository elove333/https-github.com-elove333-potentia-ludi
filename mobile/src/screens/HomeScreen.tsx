import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * HomeScreen
 * 
 * Main home screen of the application.
 * Entry point for authenticated users.
 */
const HomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to STEPFLOW</Text>
      <Text style={styles.subtitle}>Your rhythm and motion training companion</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen;
