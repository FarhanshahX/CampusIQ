/**
 * BLEManager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised Bluetooth Low Energy helper for the Attendance Module.
 *
 * Teacher side  → advertises the session's bluetoothToken as a BLE peripheral.
 * Student side  → scans for that advertisement; returns true when in range.
 *
 * Library used: react-native-ble-plx  (works on both iOS & Android).
 *
 * Installation:
 *   npm install react-native-ble-plx
 *   # iOS:
 *   cd ios && pod install
 *   # Add NSBluetoothAlwaysUsageDescription & NSBluetoothPeripheralUsageDescription
 *   # to Info.plist
 *   # Android:
 *   # Add BLUETOOTH, BLUETOOTH_ADMIN, ACCESS_FINE_LOCATION, BLUETOOTH_SCAN,
 *   # BLUETOOTH_CONNECT, BLUETOOTH_ADVERTISE permissions to AndroidManifest.xml
 *
 * NOTE: BLE advertising (peripheral role) is NOT supported by react-native-ble-plx.
 * For the TEACHER side we use a separate library: react-native-peripheral
 *   npm install react-native-peripheral
 *
 * The token is embedded in the BLE Local Name of the advertisement so it is
 * readable without a GATT connection, which keeps the scan fast and simple.
 *
 * TOKEN FORMAT in advertisement local name:
 *   "ATT:<first-16-chars-of-bluetoothToken>"
 * e.g. "ATT:a3f8c2e1d0b94712"
 *
 * We only embed the first 16 hex chars (64-bit) of the 32-char token because
 * the BLE Local Name is capped at 29 bytes in the advertisement packet.
 * The full token is still verified server-side.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BleManager, State } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";

// ── Singleton BLE manager (shared across the whole app) ──────────────────────
let _manager = null;

const getManager = () => {
  if (!_manager) _manager = new BleManager();
  return _manager;
};

// ── Constants ────────────────────────────────────────────────────────────────
export const ATT_PREFIX = "ATT:";
const TOKEN_CHARS = 16; // first 16 hex chars of the token embedded in the advert

// Minimum signal strength required to be considered "in range" (dBm)
// -70 to -80 is generally a good "same room" threshold.
export const RSSI_THRESHOLD = -80;

// Builds the Local Name string that the teacher's device will advertise
export const buildAdvertName = (bluetoothToken) =>
  `${ATT_PREFIX}${bluetoothToken.slice(0, TOKEN_CHARS)}`;

// Extracts the token fragment from a Local Name string
export const extractTokenFragment = (localName = "") =>
  localName.startsWith(ATT_PREFIX) ? localName.slice(ATT_PREFIX.length) : null;

// ── Android permissions ──────────────────────────────────────────────────────
export const requestAndroidPermissions = async () => {
  if (Platform.OS !== "android") return true;

  // Android 12+ needs BLUETOOTH_SCAN and BLUETOOTH_CONNECT
  if (Platform.Version >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === "granted" &&
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === "granted"
    );
  }

  // Android < 12 needs ACCESS_FINE_LOCATION for BLE scanning
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

// ── Wait for BLE to power on ──────────────────────────────────────────────────
export const waitForBluetooth = (manager) =>
  new Promise((resolve, reject) => {
    const sub = manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        sub.remove();
        resolve();
      } else if (state === State.Unsupported || state === State.Unauthorized) {
        sub.remove();
        reject(new Error(`Bluetooth state: ${state}`));
      }
    }, true /* emitCurrentState */);
  });

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT — scan for the teacher's advertisement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scans for BLE advertisements and resolves true/false depending on whether
 * the teacher's device is found within `timeoutMs` milliseconds.
 *
 * @param {string}  bluetoothToken  Full token from AttendanceSession
 * @param {number}  timeoutMs       How long to scan (default 8 s)
 * @returns {Promise<boolean>}
 */
export const scanForTeacher = (bluetoothToken, timeoutMs = 8000) => {
  return new Promise(async (resolve) => {
    const manager = getManager();
    let found = false;
    let timer = null;

    try {
      const permOk = await requestAndroidPermissions();
      if (!permOk) return resolve(false);

      await waitForBluetooth(manager);

      const targetFragment = bluetoothToken.slice(0, TOKEN_CHARS);

      const stop = () => {
        clearTimeout(timer);
        manager.stopDeviceScan();
        resolve(found);
      };

      timer = setTimeout(stop, timeoutMs);

      manager.startDeviceScan(
        null, // no UUID filter — we match by Local Name
        { allowDuplicates: false },
        (error, device) => {
          if (error || !device) return;

          const localName = device.localName || device.name || "";
          const fragment = extractTokenFragment(localName);

          if (fragment && fragment === targetFragment) {
            // Check signal strength (RSSI) to ensure proximity
            // Note: device.rssi is null if not available
            if (device.rssi !== null && device.rssi >= RSSI_THRESHOLD) {
              found = true;
              stop();
            } else {
              console.log(
                `[BLE] Found device but signal too weak: ${device.rssi} dBm`,
              );
            }
          }
        },
      );
    } catch (err) {
      console.warn("[BLE] scanForTeacher error:", err.message);
      resolve(false);
    }
  });
};

/**
 * Continuously rescans every `intervalMs` ms and keeps `setIsInRange`
 * updated. Returns a cleanup function (call on component unmount).
 *
 * @param {string}   bluetoothToken
 * @param {Function} setIsInRange      React state setter
 * @param {number}   intervalMs        Re-scan interval (default 15 s)
 * @param {number}   scanTimeoutMs     Each scan's timeout (default 8 s)
 * @returns {Function} cleanup
 */
export const startContinuousScan = (
  bluetoothToken,
  setIsInRange,
  intervalMs = 15000,
  scanTimeoutMs = 8000,
) => {
  let cancelled = false;

  const runScan = async () => {
    if (cancelled) return;
    const inRange = await scanForTeacher(bluetoothToken, scanTimeoutMs);
    if (!cancelled) setIsInRange(inRange);
    if (!cancelled) setTimeout(runScan, intervalMs);
  };

  runScan(); // kick off immediately

  return () => {
    cancelled = true;
    getManager().stopDeviceScan();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER — advertise the session token as a BLE peripheral
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Uses react-native-peripheral to broadcast the session token.
 *
 * Installation:
 *   npm install react-native-peripheral
 *   cd ios && pod install
 *
 * AndroidManifest.xml must include:
 *   <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE"/>
 *
 * This module is imported lazily so the student bundle is not affected if
 * react-native-peripheral is not installed (it's only needed on teacher builds).
 */

let _peripheral = null;
const getPeripheral = () => {
  if (!_peripheral) {
    // Lazy import — only available on teacher builds
    _peripheral = require("react-native-peripheral").default;
  }
  return _peripheral;
};

/**
 * Begin BLE advertising with the session token embedded in the Local Name.
 *
 * @param {string} bluetoothToken   Full token from AttendanceSession
 * @returns {Promise<void>}
 */
export const startAdvertising = async (bluetoothToken) => {
  const Peripheral = getPeripheral();

  // Request BLUETOOTH_ADVERTISE on Android 12+
  if (Platform.OS === "android" && Platform.Version >= 31) {
    const granted = await PermissionsAndroid.request(
      "android.permission.BLUETOOTH_ADVERTISE",
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error("BLUETOOTH_ADVERTISE permission denied.");
    }
  }

  await Peripheral.start(); // initialise peripheral manager

  await Peripheral.setName(buildAdvertName(bluetoothToken));

  await Peripheral.startAdvertising({
    localName: buildAdvertName(bluetoothToken),
    serviceUUIDs: [], // no GATT service needed — Local Name is enough
  });

  console.log("[BLE] Advertising started:", buildAdvertName(bluetoothToken));
};

/**
 * Stop BLE advertising (call when the session is closed or the screen unmounts).
 */
export const stopAdvertising = async () => {
  try {
    const Peripheral = getPeripheral();
    await Peripheral.stopAdvertising();
    console.log("[BLE] Advertising stopped.");
  } catch (err) {
    console.warn("[BLE] stopAdvertising error:", err.message);
  }
};
