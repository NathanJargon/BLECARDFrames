import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';

const { width, height } = Dimensions.get('window');

/* Things to note about BLE pairing:
The Bluetooth library you're using (react-native-ble-manager) typically handles BLE (Bluetooth Low Energy) devices,
which may not support some classic Bluetooth devices like TWS headphones or any non-BLE devices.

BLE is designed for low power consumption and is typically used for devices that need to send small amounts of data intermittently.
Classic Bluetooth is used for devices that require continuous data streaming, such as audio devices.

When you connect to a BLE device using your app, the connection might not be reflected in the phone's Bluetooth settings. 
This is because BLE connections are managed at the application level and might not be visible in the system's Bluetooth settings.
*/

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