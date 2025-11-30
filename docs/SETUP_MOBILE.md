# Mobile App Setup Guide

Complete guide to get your makeup detection mobile app up and running.

## Overview

This hybrid approach uses:
- **Backend**: FastAPI server (Python) that loads your `.pt` YOLO model
- **Mobile App**: React Native (Expo) that connects to the backend

## Step 1: Backend Setup

### 1.1 Install Backend Dependencies

```bash
# Add FastAPI dependencies to requirements.txt
pip install fastapi uvicorn python-multipart
```

Or add to your `requirements.txt`:
```
fastapi
uvicorn[standard]
python-multipart
```

### 1.2 Start the API Server

```bash
# From project root
python -m src.api.main

# Or using uvicorn directly
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at `http://localhost:8000`

### 1.3 Verify Backend is Running

Open your browser and visit:
- http://localhost:8000/health
- http://localhost:8000/docs (API documentation)

You should see:
```json
{
  "status": "healthy",
  "model_loaded": true/false,
  "model_path": "models/final/best.pt"
}
```

### 1.4 Load Your Model (if not auto-loaded)

If your model isn't at `models/final/best.pt`, you can load it via API:

```bash
curl -X POST "http://localhost:8000/load-model" \
  -H "Content-Type: application/json" \
  -d '{"model_file": "path/to/your/model.pt"}'
```

## Step 2: Find Your Computer's IP Address

Your mobile device needs to connect to your computer's IP address (not localhost).

### Windows
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).

### Mac/Linux
```bash
ifconfig
# or
ip addr
```
Look for your network interface (usually `en0` or `wlan0`) and find the `inet` address.

**Example**: If your IP is `192.168.1.100`, your API URL will be `http://192.168.1.100:8000`

## Step 3: Mobile App Setup

### 3.1 Install Prerequisites

- **Node.js**: Download from https://nodejs.org/ (v14 or higher)
- **Expo CLI**: 
  ```bash
  npm install -g expo-cli
  ```
- **Expo Go App**: Install on your phone
  - iOS: https://apps.apple.com/app/expo-go/id982107779
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

### 3.2 Install Mobile App Dependencies

```bash
cd mobile
npm install
```

### 3.3 Configure API URL

Edit `mobile/App.js` and update line 12:

```javascript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:8000'  // Replace with YOUR computer's IP
  : 'https://your-production-api.com';
```

**Important**: Replace `192.168.1.100` with your actual IP address from Step 2.

### 3.4 Start the Mobile App

```bash
cd mobile
npm start
```

This opens Expo DevTools. You'll see a QR code.

### 3.5 Connect Your Phone

**Option A: Expo Go (Recommended for testing)**
1. Open Expo Go app on your phone
2. Scan the QR code:
   - **iOS**: Use Camera app to scan
   - **Android**: Use Expo Go app to scan
3. The app will load on your phone

**Option B: Emulator/Simulator**
- Press `i` for iOS simulator (Mac only)
- Press `a` for Android emulator
- Press `w` for web browser

## Step 4: Test the Connection

1. Make sure both devices are on the **same Wi-Fi network**
2. In the mobile app, check the status bar at the top:
   - **Green "API Ready"**: Connection successful! ✅
   - **Orange "No Model Loaded"**: Backend running but no model loaded
   - **Red "API Offline"**: Can't connect to backend

3. If offline, check:
   - Backend is running (`python -m src.api.main`)
   - Correct IP address in `App.js`
   - Both devices on same Wi-Fi
   - Firewall isn't blocking port 8000

## Step 5: Test Detection

1. Grant camera permissions when prompted
2. Point camera at a makeup product
3. Tap the capture button (white circle)
4. Wait for detection results
5. View detected products in the results panel

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Use a different port
uvicorn src.api.main:app --port 8001
```

**Model not loading:**
- Check model file path exists
- Verify model is a valid YOLO `.pt` file
- Check console for error messages

**CORS errors:**
- Already configured in `src/api/main.py`
- If issues persist, check `allow_origins` in CORS middleware

### Mobile App Issues

**Can't connect to API:**
1. Verify IP address is correct
2. Check both devices on same network
3. Try disabling firewall temporarily
4. Test API in browser: `http://YOUR_IP:8000/health`

**Camera not working:**
- Grant camera permissions in device settings
- Restart the app
- Check `app.json` has camera permissions configured

**Build errors:**
```bash
# Clear cache and reinstall
cd mobile
rm -rf node_modules
npm install
expo start -c
```

### Network Issues

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Allow Python through firewall
3. Or allow port 8000

**Mac Firewall:**
1. System Preferences > Security & Privacy > Firewall
2. Allow Python or disable firewall for testing

## Quick Test Commands

```bash
# Test backend health
curl http://localhost:8000/health

# Test detection (from project root)
curl -X POST "http://localhost:8000/detect?confidence=0.25" \
  -F "image=@path/to/test/image.jpg"

# Check if port is accessible
# Windows
netstat -an | findstr 8000

# Mac/Linux
lsof -i :8000
```

## Next Steps

Once everything is working:

1. **Add confidence slider** in mobile app UI
2. **Implement real-time detection** (process video frames)
3. **Add product filtering** by category
4. **Save detection history** locally
5. **Optimize for production** (TFLite conversion for offline mode)

## Production Deployment

For production, you'll want to:

1. **Deploy backend** to a cloud service (AWS, Heroku, etc.)
2. **Update API URL** in mobile app to production URL
3. **Build mobile app** for App Store/Play Store:
   ```bash
   cd mobile
   eas build --platform ios
   eas build --platform android
   ```

## Architecture Diagram

```
┌─────────────────┐
│  Mobile Device  │
│  (React Native) │
│                 │
│  Camera → API   │
└────────┬────────┘
         │ HTTP POST
         │ (Image)
         ▼
┌─────────────────┐
│  FastAPI Server │
│  (Python)       │
│                 │
│  YOLO Model     │
│  (.pt file)     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Detection      │
│  Results        │
│  (JSON)         │
└─────────────────┘
```

## Support

If you encounter issues:
1. Check the console logs (both backend and mobile)
2. Verify all steps above
3. Test API endpoints directly with curl/Postman
4. Check network connectivity between devices

