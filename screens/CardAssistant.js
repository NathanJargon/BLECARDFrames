import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const { width, height } = Dimensions.get('window');

export default function CardAssistant({ navigation }) {
  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission === 'denied') {
        // Handle permission denied
      }
    };

    requestCameraPermission();
  }, []);

  if (device == null) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Hit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Stand</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Double Down</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Split</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Status: Waiting for action...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center', // Center all elements horizontally
  },
  camera: {
    width: '100%',
    height: height * 0.4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    width: '100%', // Ensure buttons are centered within the container
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderWidth: 1, // Add border width
    borderColor: '#000', // Add border color
    width: '90%', // Ensure the container is centered
    borderRadius: 5, // Optional: Add border radius for rounded corners
  },
  statusText: {
    fontSize: 16,
    color: '#000',
  },
});