import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * WelcomeScreen
 * 
 * Welcome screen for new users.
 */
const WelcomeScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to STEPFLOW</Text>
      <Text style={styles.subtitle}>Get started with rhythm and motion training</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200ee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
  },
});

export default WelcomeScreen;
