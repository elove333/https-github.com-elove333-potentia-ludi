import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * TrainingScreen
 * 
 * Training session screen where users perform rhythm and motion exercises.
 */
const TrainingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Training Session</Text>
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
  },
});

export default TrainingScreen;
