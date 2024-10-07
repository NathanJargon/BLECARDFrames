import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function Welcome({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Pairing');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Blackjack for <Text style={styles.redText}>FRAMES</Text>
      </Text>
      <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
  },
  redText: {
    color: 'red',
  },
  loader: {
    marginTop: 20,
  },
});