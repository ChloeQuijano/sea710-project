/**
 * API Service for Makeup Product Detection
 * Handles all API communication with the FastAPI backend
 */

/**
 * Check API health status
 */
export const getHealthStatus = async (baseUrl) => {
  try {
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw new Error('Failed to connect to API server');
  }
};

/**
 * Detect products in an image
 * @param {string} baseUrl - API base URL
 * @param {string} imageUri - Local file URI of the image
 * @param {number} confidence - Confidence threshold (0.0-1.0)
 * @returns {Promise<Object>} Detection results
 */
export const detectProducts = async (baseUrl, imageUri, confidence = 0.25) => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // For React Native, use the proper format
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg', // Always use jpeg for camera photos
      name: 'photo.jpg',
    });

    console.log(`[API] Sending detection request to ${baseUrl}/detect`);
    console.log(`[API] Image URI: ${imageUri.substring(0, 50)}...`);

    // Make request
    // Note: Don't set Content-Type header - let fetch set it automatically with boundary
    const url = `${baseUrl}/detect?confidence=${confidence}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Content-Type will be set automatically by fetch with proper boundary
    });

    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
      console.error(`[API] Error response:`, errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[API] Detection successful: ${result.count || 0} detections`);
    return result;
  } catch (error) {
    console.error('[API] Detection error:', error);
    throw error;
  }
};

/**
 * Detect products and get annotated image
 * @param {string} baseUrl - API base URL
 * @param {string} imageUri - Local file URI of the image
 * @param {number} confidence - Confidence threshold (0.0-1.0)
 * @returns {Promise<Object>} Detection results with annotated image
 */
export const detectProductsWithImage = async (baseUrl, imageUri, confidence = 0.25) => {
  try {
    const formData = new FormData();
    
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('image', {
      uri: imageUri,
      type: type,
      name: filename,
    });

    const url = `${baseUrl}/detect-with-image?confidence=${confidence}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Content-Type will be set automatically by fetch with proper boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Detection error:', error);
    throw error;
  }
};

/**
 * Load a model on the server
 * @param {string} baseUrl - API base URL
 * @param {string} modelPath - Path to model file on server
 */
export const loadModel = async (baseUrl, modelPath) => {
  try {
    const response = await fetch(`${baseUrl}/load-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model_file: modelPath }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Load model error:', error);
    throw error;
  }
};

/**
 * Set confidence threshold on server
 * @param {string} baseUrl - API base URL
 * @param {number} threshold - Confidence threshold (0.0-1.0)
 */
export const setConfidence = async (baseUrl, threshold) => {
  try {
    const response = await fetch(`${baseUrl}/set-confidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ threshold }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Set confidence error:', error);
    throw error;
  }
};

/**
 * Detect face mesh landmarks using MediaPipe
 * @param {string} baseUrl - API base URL
 * @param {string} imageUri - Local file URI of the image
 * @param {boolean} drawMesh - Whether to return annotated image with mesh drawn
 * @returns {Promise<Object>} Face mesh detection results
 */
export const detectFaceMesh = async (baseUrl, imageUri, drawMesh = false) => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('image', {
      uri: imageUri,
      type: type,
      name: filename,
    });

    // Make request
    const url = `${baseUrl}/detect-face-mesh?draw_mesh=${drawMesh}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Content-Type will be set automatically by fetch with proper boundary
    });

    if (!response.ok) {
      // Return a safe error response instead of throwing
      const errorData = await response.json().catch(() => ({}));
      console.log('[Face Mesh API] Error response:', errorData.detail || `HTTP error! status: ${response.status}`);
      return {
        status: 'error',
        face_detected: false,
        message: errorData.detail || `HTTP error! status: ${response.status}`,
        landmarks: [],
        num_landmarks: 0,
      };
    }

    return await response.json();
  } catch (error) {
    // Silently handle errors - return safe response instead of throwing to prevent popups
    console.log('[Face Mesh API] Network/processing error:', error.message);
    return {
      status: 'error',
      face_detected: false,
      message: error.message || 'Network error',
      landmarks: [],
      num_landmarks: 0,
    };
  }
};

