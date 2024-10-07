import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, BackHandler } from 'react-native';
import { RNCamera } from 'react-native-camera';

const { width, height } = Dimensions.get('window');

export default function CardAssistant({ navigation }) {
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Pairing');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        captureAudio={false}
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