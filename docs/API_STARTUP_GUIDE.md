# API Startup Guide

## Quick Start

### 1. Install Dependencies

Make sure you have all required Python packages installed:

```bash
pip install -r requirements.txt
```

Key dependencies:
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `python-multipart` - For file uploads
- `ultralytics` - YOLO model inference
- `opencv-python` - Image processing
- `numpy` - Array operations
- `Pillow` - Image handling

### 2. Start the API Server

From the project root directory, run:

```bash
# Option 1: Using Python module
python -m src.api.main

# Option 2: Using uvicorn directly (recommended for development)
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables auto-reload on code changes (useful for development).

### 3. Verify Server is Running

Open your browser and visit:
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc

You should see a JSON response like:
```json
{
  "status": "healthy",
  "model_loaded": false,
  "model_path": null,
  "confidence_threshold": 0.25
}
```

### 4. Load a Model (Required for Detection)

The API will automatically try to load `models/final/best.pt` on startup, but if that file doesn't exist, you'll need to load a model manually:

**Using the API:**
```bash
curl -X POST "http://localhost:8000/load-model" \
  -H "Content-Type: application/json" \
  -d '{"model_file": "models/final/best.pt"}'
```

**Or via Swagger UI:**
1. Go to http://localhost:8000/docs
2. Find the `/load-model` endpoint
3. Click "Try it out"
4. Enter your model path (e.g., `models/final/best.pt`)
5. Click "Execute"

### 5. Configure Mobile App IP Address

In `mobile/App.js`, update the IP address:

```javascript
const API_BASE_URL = __DEV__
  ? 'http://YOUR_COMPUTER_IP:8000'  // Replace with your computer's IP
  : 'https://your-production-api.com';
```

**To find your IP address:**
- **Windows**: Run `ipconfig` in Command Prompt, look for "IPv4 Address"
- **Mac/Linux**: Run `ifconfig` or `ip addr`, look for your network interface IP

**Important**: 
- Your computer and mobile device must be on the same Wi-Fi network
- Make sure Windows Firewall allows connections on port 8000

### 6. Test the API

**Test health endpoint:**
```bash
curl http://localhost:8000/health
```

**Test detection (if model is loaded):**
```bash
curl -X POST "http://localhost:8000/detect?confidence=0.25" \
  -F "image=@path/to/your/image.jpg"
```

## Troubleshooting

### Issue: "Model not loaded" error

**Solution**: Load a model first using `/load-model` endpoint. Make sure the model file path is correct.

### Issue: Cannot connect from mobile app

**Checklist:**
1. ✅ API server is running (`python -m src.api.main`)
2. ✅ Correct IP address in `mobile/App.js`
3. ✅ Both devices on same Wi-Fi network
4. ✅ Windows Firewall allows port 8000
5. ✅ Test with `curl http://YOUR_IP:8000/health` from another device

**Windows Firewall Fix:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port "8000"
6. Allow the connection
7. Apply to all profiles

### Issue: CORS errors

The API already has CORS enabled for all origins. If you still see CORS errors, make sure:
- The API server is running
- You're using the correct URL (check for typos)
- The mobile app is using the correct IP address

### Issue: "Module not found" errors

**Solution**: Install missing dependencies:
```bash
pip install -r requirements.txt
```

### Issue: Port 8000 already in use

**Solution**: Either:
1. Stop the other service using port 8000, or
2. Change the port in `src/api/main.py` (line 279) and update `mobile/App.js` accordingly

## Common Errors

### "Failed to connect to API server"
- Server not running
- Wrong IP address
- Firewall blocking connection
- Devices on different networks

### "Model not loaded"
- Model file doesn't exist at specified path
- Model file is corrupted
- Need to load model via `/load-model` endpoint

### "Invalid image format"
- Image file is corrupted
- Unsupported image format
- Image file is empty

## Next Steps

Once the API is running:
1. Load your trained model
2. Test with the mobile app
3. Check API status in the mobile app (should show "API Ready" when model is loaded)

