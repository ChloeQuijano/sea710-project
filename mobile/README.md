# Makeup Detection Mobile App

React Native mobile app for makeup product detection using the FastAPI backend (local hosted).

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Python 3.8+ (for backend)
- Expo CLI: `npm install -g expo-cli` (optional, included with Expo)
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Quick Start

### Step 1: Start the Backend Server

**IMPORTANT**: The backend must be running before starting the mobile app.

1. **Install Python dependencies** (from project root):
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the backend server** (from project root):
   
   **Windows:**
   ```bash
   # Option 1: Use the startup script
   start_api.bat
   
   # Option 2: Run manually
   python -m src.api.main
   ```
   
   **Mac/Linux:**
   ```bash
   # Option 1: Use the startup script
   bash start_api.sh
   
   # Option 2: Run manually
   python -m src.api.main
   ```

3. **Verify the server is running**:
   - Open your browser and go to: http://localhost:8000/health
   - You should see JSON with `"status": "healthy"`
   - Keep this terminal open - the server must stay running

### Step 2: Configure API URL

1. **Find your computer's IP address**:
   - **Windows**: Run `ipconfig` in Command Prompt, look for "IPv4 Address"
   - **Mac/Linux**: Run `ifconfig` or `ip addr`, look for your network interface IP
   - **Or use the helper script**: `python find_ip.py` (from project root)

2. **Create environment file**:
   ```bash
   cd mobile
   cp .env.template .env
   ```

3. **Update the IP address** in `mobile/.env`:
   ```bash
   # Edit mobile/.env and replace YOUR_IP_ADDRESS with your actual IP
   API_BASE_URL_DEV=http://YOUR_IP_ADDRESS:8000
   ```

   **Important**: 
   - Make sure your mobile device and computer are on the same Wi-Fi network
   - The `.env` file is gitignored and won't be committed to the repository
   - See `.env.template` for all available environment variables

### Step 3: Install Mobile Dependencies

```bash
cd mobile
npm install
```

### Step 4: Start the Expo App

```bash
npm start
```

This will open Expo DevTools in your browser. You can:
- Scan the QR code with Expo Go app (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web

## Complete Setup Instructions

### 1. Backend Setup

See the main [README.md](../README.md) for backend setup instructions.

**Quick checklist:**
- Python dependencies installed (`pip install -r requirements.txt`)
- Backend server running (`python -m src.api.main`)
- Server accessible at http://localhost:8000/health
- Model loaded (optional, but required for detection)

### 2. Mobile App Setup

1. **Install dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Configure API URL** (see Step 2 above)

3. **Start Expo**:
   ```bash
   npm start
   ```

4. **Load on device**:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal/browser
   - Make sure phone and computer are on the same Wi-Fi network

## Running on Physical Device

### Expo Go

1. Install **Expo Go** app from App Store (iOS) or Play Store (Android)
2. Start the development server: `npm start`
3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Features

- **Home Screen**: Entry point with "Scan Product" button
- **Live Camera Feed**: Real-time camera preview with detection overlay
- **Real-time Detection**: Automatic product detection every 2 seconds
- **Bounding Boxes**: Visual overlay showing detected products with labels
- **Product Cards**: Sliding bottom sheet with product details
- **Virtual Try-On**: Navigate to face camera for AR virtual try-on
- **Face Mesh Detection**: MediaPipe face mesh detection for virtual try-on
- **Class-Based Mesh Overlays**: Product-specific mesh rendering based on detected product type
- **API Status**: Monitor backend connection status
- **Camera Controls**: Flip camera, clear detections
- **Feature Flags**: Configurable feature toggles for testing and development

## Project Structure

```
mobile/
├── App.js                      # Main app entry point (wraps navigation)
├── app.json                    # Expo configuration
├── package.json                # Dependencies
│
├── navigation/
│   └── AppNavigator.js         # React Navigation Stack Navigator setup
│                               # - Defines all screen routes
│                               # - Configures header styling
│                               # - Handles navigation flow
│
├── screens/
│   ├── HomeScreen.js           # Entry screen
│   │                           # - "Scan Product" button
│   │                           # - App branding/info
│   │
│   ├── ScanProductScreen.js    # Main product detection screen
│   │                           # - Back camera feed
│   │                           # - Real-time product detection
│   │                           # - Bounding box overlays
│   │                           # - Product cards on detection
│   │                           # - API status indicator
│   │                           # - Camera controls (flip, clear)
│   │
│   ├── VirtualTryOnScreen.js   # Virtual try-on selection screen
│   │                           # - Product information display
│   │                           # - "Start Virtual Try-On" button
│   │                           # - Navigates to FaceCameraScreen
│   │
│   └── FaceCameraScreen.js     # Face camera for virtual try-on
│                               # - Front camera feed
│                               # - Face mesh detection
│                               # - Mesh overlay rendering
│                               # - Default or class-based mesh
│                               # - Product-specific AR overlay
│
├── components/
│   └── ProductCard.js          # Reusable product card component
│                               # - Sliding bottom sheet
│                               # - Product details display
│                               # - "Try Virtual Look" button
│                               # - Product image, name, price
│
├── services/
│   └── api.js                 # API service layer
│                               # - getHealthStatus()
│                               # - detectProducts()
│                               # - detectProductsWithImage()
│                               # - detectFaceMesh()
│                               # - loadModel()
│                               # - setConfidence()
│
├── config/
│   └── featureFlags.js        # Feature flags and configuration
│                               # - USE_MOCK_DETECTIONS: Enable mock data
│                               # - ENABLE_FACE_MESH: Enable face detection
│                               # - ENABLE_DEFAULT_FACE_MESH: Default vs class-based mesh
│                               # - AppConfig: API URLs, thresholds
│                               # - MockDetectionConfig: Test data
│
├── utils/
│   ├── meshOverlays.js        # Mesh overlay rendering system
│   │                           # - renderDefaultMesh(): All landmarks
│   │                           # - renderClassBasedMesh(): Product-specific
│   │                           # - Product-specific renderers:
│   │                           #   * Lip products (lipstick, lip gloss, etc.)
│   │                           #   * Eye products (eyeliner, eyeshadow, mascara)
│   │                           #   * Face products (foundation, concealer, etc.)
│   │                           #   * Blush/bronzer/highlighter
│   │
│   └── productClasses.js      # Product class enum and utilities
│                               # - ProductClass enum (all 19 product types)
│                               # - convertToProductClass() function
│                               # - Frontend product class mapping
│
└── assets/                    # Images, icons, fonts, etc.
```

## Application Flow

1. **Home Screen** → User taps "Scan Product"
2. **Scan Product Screen** → Camera detects products → Product card appears
3. **Product Card** → User taps "Try Virtual Look"
4. **Virtual Try-On Screen** → User taps "Start Virtual Try-On"
5. **Face Camera Screen** → Face mesh detection → Mesh overlay rendered

## Key Components Explained

### Feature Flags System (`config/featureFlags.js`)

Centralized configuration for toggling features:

- **USE_MOCK_DETECTIONS**: Set to `true` to use mock detection data instead of API calls (useful for testing UI without backend)
- **ENABLE_FACE_MESH**: Enable/disable face mesh detection entirely
- **ENABLE_DEFAULT_FACE_MESH**: 
  - `true`: Shows all face landmarks (default mesh)
  - `false`: Shows product-specific mesh based on detected product class

### Mesh Overlay System (`utils/meshOverlays.js`)

Handles rendering of different mesh overlays:

- **Default Mesh**: Renders all 468 MediaPipe face landmarks as dots
- **Class-Based Mesh**: Renders product-specific regions:
  - **Lip Products** (lipstick, lip gloss, lip balm): Lip region landmarks
  - **Eye Products** (eyeliner, eyeshadow, mascara): Eye region landmarks
  - **Face Products** (foundation, concealer, powder): Face oval landmarks
  - **Blush/Bronzer**: Cheek/face region landmarks
  - **Highlighter**: High points of face

Each product type can have custom styling and landmark selection.

### API Service Layer (`services/api.js`)

All backend communication is handled through this service:

- **Health checks**: Verify backend connectivity
- **Product detection**: Send images for product detection
- **Face mesh detection**: Send images for face landmark detection
- **Model management**: Load models, set confidence thresholds

### Navigation (`navigation/AppNavigator.js`)

React Navigation Stack Navigator configuration:

- Defines all screen routes
- Configures header styling (green theme)
- Handles screen transitions
- Manages navigation state

## Configuration

### API URL Configuration

The API base URL is configured in `config/featureFlags.js`:

```javascript
export const AppConfig = {
  API_BASE_URL_DEV: 'http://YOUR_IP:8000',  // Update with your IP
  API_BASE_URL_PROD: 'https://your-production-api.com',
};
```

The app automatically uses `API_BASE_URL_DEV` in development mode (`__DEV__`).

### Feature Flags

Edit `config/featureFlags.js` to toggle features:

```javascript
export const FeatureFlags = {
  USE_MOCK_DETECTIONS: true,        // Use mock data for testing
  ENABLE_FACE_MESH: true,            // Enable face mesh detection
  ENABLE_DEFAULT_FACE_MESH: true,    // Use default mesh (all landmarks)
};
```

## Development Notes

### Mock Detection Mode

When `USE_MOCK_DETECTIONS` is `true`:
- No API calls are made
- Mock product detections are used
- Useful for testing UI without backend
- Mock data is defined in `MockDetectionConfig.MOCK_DETECTIONS`

### Face Mesh Detection

Requires:
- Backend with MediaPipe installed (Python 3.7-3.10)
- `/detect-face-mesh` endpoint available
- Feature flag `ENABLE_FACE_MESH: true`

The face mesh system:
- Detects face landmarks using MediaPipe
- Returns 468 landmarks with facial regions
- Renders mesh overlay on camera preview
- Supports default or class-based rendering

### Product Classes

Supported product classes (19 total):
- beauty blender, blush, bronzer, brush, concealer
- eye liner, eye shadow, eyelash curler
- foundation, highlighter
- lip balm, lip gloss, lip liner, lip stick
- mascara, nail polish, powder, primer, setting spray

See `utils/productClasses.js` for the complete enum.

## Troubleshooting

### API Connection Issues

1. **Backend Not Running**: Make sure the backend server is started first (see Step 1 above)
2. **Check IP Address**: Make sure you're using the correct IP address in `ScanProductScreen.js`
3. **Firewall**: Ensure port 8000 is not blocked by Windows Firewall
4. **Network**: Both devices must be on the same Wi-Fi network
5. **Test Connection**: Try accessing `http://YOUR_IP:8000/health` from your phone's browser
6. **Server Status**: Check the backend terminal for any error messages

### Camera Permission Issues

- **iOS**: Check Settings > Privacy > Camera
- **Android**: Check App Settings > Permissions > Camera

### Build Errors

- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
