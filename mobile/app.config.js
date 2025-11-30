/**
 * Expo App Configuration
 * Reads environment variables from .env file
 */
require('dotenv').config();

module.exports = {
  expo: {
    name: 'MakeupDetectionApp',
    slug: 'makeup-detection-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      apiBaseUrlDev: process.env.API_BASE_URL_DEV || 'http://192.168.2.18:8000',
      apiBaseUrlProd: process.env.API_BASE_URL_PROD || 'https://your-production-api.com',
    },
    newArchEnabled: true,
  },
};

