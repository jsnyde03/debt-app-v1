// App entry — Expo Router owns routing from src/app/.
//
// `react-native-get-random-values` MUST load here, BEFORE `expo-router/entry`: Expo Router's route
// discovery evaluates route + store modules eagerly, so any `crypto.getRandomValues` use (absent in
// Hermes) has to be polyfilled first or it crashes on a fresh install only (Freedom RN lesson #5).
import 'react-native-get-random-values';
import 'expo-router/entry';
