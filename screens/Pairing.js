import React, { useEffect, useState, useCallback } from 'react';
import { BackHandler, View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity, Alert, ActivityIndicator, Image, FlatList } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { PERMISSIONS, RESULTS, requestMultiple } from 'react-native-permissions';
import { NativeEventEmitter, NativeModules } from 'react-native';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import frame from "../assets/temp_frame.png";

const { width, height } = Dimensions.get('window');
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default function Pairing({ navigation }) {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [services, setServices] = useState([]);
  const [isPaired, setIsPaired] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [scanTimeout, setScanTimeout] = useState(null);
  const [isBluetoothOn, setIsBluetoothOn] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 30) {
        setStatusMessage('Requesting permissions...');
        const statuses = await requestMultiple([
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        ]);

        console.log('Permission statuses:', statuses);

        if (
          statuses[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] !== RESULTS.GRANTED ||
          statuses[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== RESULTS.GRANTED ||
          statuses[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== RESULTS.GRANTED
        ) {
          Alert.alert('Permission Denied', 'Location and Bluetooth permissions are required to scan for Bluetooth devices.');
          setStatusMessage('Permissions denied.');
          return false;
        }

        setStatusMessage('Permissions granted.');
      } else if (Platform.OS === 'android') {
        setStatusMessage('Permissions not required for Android versions below 30.');
      }
      return true;
    };

    const checkBluetoothState = async () => {
      try {
        const state = await BluetoothStateManager.getState();
        if (state === 'PoweredOn') {
          setIsBluetoothOn(true);
          setStatusMessage('Bluetooth is enabled.');
          scanAndConnect();
        } else {
          setIsBluetoothOn(false);
          setStatusMessage('Bluetooth is off. Please enable it.');
        }
      } catch (error) {
        console.error('Error checking Bluetooth state:', error);
        setStatusMessage('Error checking Bluetooth state.');
      }
    };

    const enableBluetooth = async () => {
      try {
        await BleManager.start({ showAlert: false });
        checkBluetoothState();
      } catch (error) {
        console.error('Error enabling Bluetooth:', error);
        setStatusMessage('Error enabling Bluetooth.');
      }
    };

    const initialize = async () => {
      const permissionsGranted = await requestPermissions();
      if (!permissionsGranted) return;

      await enableBluetooth();

      const backAction = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            {
              text: 'No',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: () => BackHandler.exitApp(),
            },
          ],
          { cancelable: false }
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      // Add Bluetooth state change listener
      const bluetoothStateListener = BluetoothStateManager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          setIsBluetoothOn(true);
          setStatusMessage('Bluetooth is enabled.');
        } else {
          setIsBluetoothOn(false);
          setStatusMessage('Bluetooth is off. Please enable it.');
        }
      }, true);

      return () => {
        if (connectedDevice) {
          BleManager.disconnect(connectedDevice.id);
        }
        if (scanTimeout) {
          clearTimeout(scanTimeout);
        }
        backHandler.remove();
        bluetoothStateListener.remove(); // Remove Bluetooth state change listener
      };
    };

    initialize();

    return () => {
      if (connectedDevice) {
        BleManager.disconnect(connectedDevice.id);
      }
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [connectedDevice]);

  const scanAndConnect = useCallback(async () => {
    // Check Bluetooth state before scanning
    try {
      const state = await BluetoothStateManager.getState();
      if (state !== 'PoweredOn') {
        setStatusMessage('Bluetooth is off. Please enable it.');
        setIsConnecting(false);
        return;
      }

      setStatusMessage('Scanning for devices...');
      setIsConnecting(true);
      setAvailableDevices([]); // Clear the list of available devices

      BleManager.scan([], 30, true).then(() => {
        setStatusMessage('Scanning...');
      });

      const handleDiscoverPeripheral = (device) => {
        setAvailableDevices((prevDevices) => {
          if (!prevDevices.some((d) => d.id === device.id)) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      };

      bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);

      // Set a timeout to stop scanning after 30 seconds
      const timeout = setTimeout(() => {
        BleManager.stopScan().then(() => {
          setStatusMessage('Scan completed.');
          setIsConnecting(false);
          bleManagerEmitter.removeListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
        });
      }, 30000);

      setScanTimeout(timeout);
    } catch (error) {
      console.error('Error during scan and connect:', error);
      setStatusMessage('Error during scan and connect.');
      setIsConnecting(false);
    }
  }, []);

  const handleUseDevice = () => {
    if (connectedDevice) {
      Alert.alert('Device in Use', `Using device: ${connectedDevice.name}`);
      setIsPaired(true);
      navigation.navigate('CardAssistant'); // Navigate to CardAssistant screen
    } else {
      Alert.alert('No Device Found', 'Please scan for a Device first.');
    }
  };

  const handleRescan = () => {
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }
    scanAndConnect();
  };

  const handleDeviceSelect = (device) => {
    setStatusMessage(`Connecting to ${device.name}...`);
    setIsConnecting(true);

    BleManager.connect(device.id)
      .then(() => {
        setConnectedDevice(device);
        setStatusMessage(`Connected to ${device.name}`);
        return BleManager.retrieveServices(device.id);
      })
      .then((deviceWithServices) => {
        setServices(deviceWithServices.services);
        setIsConnecting(false);
      })
      .catch((error) => {
        console.error('Error connecting to device:', error);
        setStatusMessage('Error connecting to device.');
        setIsConnecting(false);
      });
  };

  const renderContent = () => {
    if (isConnecting) {
      return (
        <View style={styles.noDevicesContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      );
    } else if (connectedDevice) {
      return (
        <View style={styles.deviceListContainer}>
          <Text style={styles.frameFoundText}>DEVICE FOUND</Text>
          <Image source={frame} style={styles.frameImage} />
          <TouchableOpacity style={styles.useButton} onPress={handleUseDevice}>
            <Text style={styles.buttonText}>Pair</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (!isBluetoothOn) {
      return (
        <View style={styles.noDevicesContainer}>
          <Text style={styles.noDevicesText}>Bluetooth is off. Please enable it.</Text>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.noDevicesContainer}>
          <Text style={styles.noDevicesText}>No device connected</Text>
          <Text style={styles.statusText}>{statusMessage}</Text>
          <FlatList
            data={availableDevices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.deviceItem} onPress={() => handleDeviceSelect(item)}>
                <Text style={styles.deviceItemText}>{item.name || 'Unknown Device'}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.rescanButton} onPress={handleRescan}>
            <Text style={styles.buttonText}>Rescan</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>
        Blackjack for <Text style={styles.redText}>FRAMES</Text>
      </Text>
      <View style={styles.centeredContainer}>
        <Text style={styles.centeredText}>SETUP YOUR DEVICE</Text>
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Set background to white
    paddingTop: 50,
  },
  headerText: {
    fontSize: width * 0.07,
    marginTop: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000', // Set text color to black for better contrast
  },
  redText: {
    color: 'red',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredText: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#000', // Set text color to black for better contrast
  },
  deviceListContainer: {
    width: '90%', // Increase the width
    alignItems: 'center',
    justifyContent: 'center', // Center the container
    padding: 20,
    marginBottom: 20,
    marginLeft: 20,
    borderWidth: 1,
    borderColor: '#000', // Set border color to black for better contrast
    borderRadius: 10,
    backgroundColor: '#ccc', // Lighten the background for better contrast
  },
  frameFoundText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000', // Set text color to black for better contrast
  },
  frameImage: {
    width: width * 0.7,
    height: height * 0.25,
    resizeMode: 'contain',
  },
  useButton: {
    backgroundColor: '#000', // Set button background to black
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '80%', // Increase the width of the button
    alignItems: 'center', // Center the text inside the button
  },
  buttonText: {
    color: '#fff', // Set text color to white
    fontSize: 16,
  },
  noDevicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Add border width
    borderColor: '#000', // Add border color
    borderRadius: 10, // Optional: Add border radius for rounded corners
    width: '90%', // Increase the width of the container
    height: '80%', // Increase the height of the container
    marginBottom: 20,
    marginLeft: 20,
  },
  noDevicesText: {
    marginTop: 20,
    fontSize: width * 0.05,
    marginBottom: 20,
    color: '#000', // Set text color to black for better contrast
  },
  statusText: {
    fontSize: width * 0.04,
    marginTop: 10,
    textAlign: 'center',
    color: '#000', // Set text color to black for better contrast
  },
  rescanButton: {
    backgroundColor: '#000', // Set button background to black
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
    width: '80%', // Increase the width of the button
    alignItems: 'center', // Center the text inside the button
  },
  deviceItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#000', // Set item background to black
    borderRadius: 5,
    width: '100%', // Increase the width of the item
    alignItems: 'center', // Center the text inside the item
  },
  deviceItemText: {
    color: '#fff', // Set text color to white
    fontSize: 16,
  },
});