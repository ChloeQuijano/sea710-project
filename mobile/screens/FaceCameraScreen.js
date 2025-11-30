import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { detectFaceMesh } from '../services/api';
import { AppConfig, FeatureFlags } from '../config/featureFlags';
import { renderDefaultMesh, renderClassBasedMesh } from '../utils/meshOverlays';

const API_BASE_URL = __DEV__
  ? AppConfig.API_BASE_URL_DEV
  : AppConfig.API_BASE_URL_PROD;

const FACE_DETECTION_INTERVAL = 500; // Run face detection every 500ms for real-time feel

export default function FaceCameraScreen({ route, navigation }) {
  const { productType, productName, productImageUrl } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType] = useState('front'); // Front camera for face
  const [faceMeshData, setFaceMeshData] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [photoDimensions, setPhotoDimensions] = useState(null);
  const [cameraViewDimensions, setCameraViewDimensions] = useState(null);
  const cameraRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  useEffect(() => {
    // Start continuous face detection only if feature flag is enabled
    if (FeatureFlags.ENABLE_FACE_MESH) {
      startFaceDetection();
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const startFaceDetection = () => {
    if (!FeatureFlags.ENABLE_FACE_MESH) return;
    
    detectionIntervalRef.current = setInterval(() => {
      if (!isDetecting && cameraRef.current) {
        detectFace();
      }
    }, FACE_DETECTION_INTERVAL);
  };

  const detectFace = async () => {
    if (!cameraRef.current || isDetecting || !FeatureFlags.ENABLE_FACE_MESH) return;

    setIsDetecting(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: false,
      });

      // Store photo dimensions for coordinate scaling
      if (photo.width && photo.height) {
        setPhotoDimensions({ width: photo.width, height: photo.height });
      }

      const result = await detectFaceMesh(API_BASE_URL, photo.uri, false);

      console.log('[Face Detection] Result:', {
        status: result.status,
        face_detected: result.face_detected,
        num_landmarks: result.num_landmarks,
        has_landmarks: !!result.landmarks,
        landmarks_count: result.landmarks?.length,
        bbox: result.bbox,
        image_dimensions: result.image_dimensions,
        photo_dimensions: { width: photo.width, height: photo.height },
      });

      if (result.status === 'success') {
        if (result.face_detected && result.landmarks && result.landmarks.length > 0) {
          // Use image dimensions from API response if available, otherwise use photo dimensions
          const imgDims = result.image_dimensions || { width: photo.width, height: photo.height };
          setPhotoDimensions(imgDims);
          setFaceMeshData(result);
          setFaceDetected(true);
        } else {
          setFaceMeshData(null);
          setFaceDetected(false);
        }
      }
    } catch (error) {
      // Silently handle errors - don't show popups or console errors
      setFaceMeshData(null);
      setFaceDetected(false);
    } finally {
      setIsDetecting(false);
    }
  };

  const renderFaceMesh = () => {
    if (!faceMeshData || !faceMeshData.landmarks) {
      console.log('[Face Mesh] Cannot render - missing data:', {
        hasData: !!faceMeshData,
        hasLandmarks: !!faceMeshData?.landmarks,
        landmarksCount: faceMeshData?.landmarks?.length,
      });
      return null;
    }

    const { landmarks, bbox } = faceMeshData;
    
    // Use camera view dimensions if available, otherwise fall back to window dimensions
    const viewDims = cameraViewDimensions || Dimensions.get('window');
    const viewWidth = viewDims.width;
    const viewHeight = viewDims.height;

    // Get image dimensions from API response or photo dimensions
    const imgDims = faceMeshData.image_dimensions || photoDimensions;
    
    if (!imgDims) {
      console.warn('[Face Mesh] No image dimensions available, using fallback scaling');
      return null;
    }

    const imgWidth = imgDims.width;
    const imgHeight = imgDims.height;

    // Calculate scaling factors
    // Camera preview typically fills the view, so we scale from image coords to view coords
    const imgAspectRatio = imgWidth / imgHeight;
    const viewAspectRatio = viewWidth / viewHeight;

    let scaleX, scaleY, offsetX = 0, offsetY = 0;

    // For front-facing camera, the preview is typically mirrored, but the photo is not
    // So we need to flip X coordinates horizontally
    const isFrontCamera = cameraType === 'front';
    const mirrorX = isFrontCamera;

    if (viewAspectRatio > imgAspectRatio) {
      // View is wider than image - image will be letterboxed (black bars on sides)
      // Scale based on height to fill view height
      scaleY = viewHeight / imgHeight;
      scaleX = scaleY; // Maintain aspect ratio
      offsetX = (viewWidth - imgWidth * scaleX) / 2;
    } else {
      // View is taller than image - image will be pillarboxed (black bars on top/bottom)
      // Scale based on width to fill view width
      scaleX = viewWidth / imgWidth;
      scaleY = scaleX; // Maintain aspect ratio
      offsetY = (viewHeight - imgHeight * scaleY) / 2;
    }

    // Prepare scaling parameters for mesh overlay functions
    const scalingParams = {
      landmarks,
      viewWidth,
      viewHeight,
      scaleX,
      scaleY,
      offsetX,
      offsetY,
      mirrorX,
    };

    // Determine which mesh to render based on feature flag
    let meshPoints = [];
    
    if (FeatureFlags.ENABLE_DEFAULT_FACE_MESH) {
      // Render default mesh (all landmarks)
      meshPoints = renderDefaultMesh(landmarks, scalingParams);
    } else {
      // Render class-based mesh overlay
      meshPoints = renderClassBasedMesh(productType, faceMeshData, scalingParams);
    }

    console.log('[Face Mesh] Rendering:', {
      useDefaultMesh: FeatureFlags.ENABLE_DEFAULT_FACE_MESH,
      productType,
      landmarksCount: landmarks.length,
      meshPointsCount: meshPoints.length,
      imageDimensions: { imgWidth, imgHeight },
      viewDimensions: { viewWidth, viewHeight },
    });

    if (!meshPoints || meshPoints.length === 0) {
      return null;
    }

    return (
      <View style={styles.meshOverlay}>
        {meshPoints.map((point) => {
          // Get style based on point type
          const pointStyle = getPointStyle(point.type);
          
          return (
            <View
              key={point.key}
              style={[
                pointStyle,
                {
                  left: point.x,
                  top: point.y,
                  width: point.size || 3,
                  height: point.size || 3,
                  borderRadius: (point.size || 3) / 2,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  /**
   * Get style for different mesh point types
   */
  const getPointStyle = (pointType) => {
    switch (pointType) {
      case 'lip':
        return styles.lipPoint;
      case 'eye':
        return styles.eyePoint;
      case 'face':
        return styles.facePoint;
      case 'landmark':
      default:
        return styles.landmarkPoint;
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.errorSubtext}>
          Please enable camera permissions in your device settings
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        ratio="16:9"
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCameraViewDimensions({ width, height });
          console.log('[Camera] View dimensions:', { width, height });
        }}
      >
        <View style={styles.cameraOverlay}>
          {/* Product Info Overlay */}
          <View style={styles.productInfoOverlay}>
            <Text style={styles.productName} numberOfLines={1}>
              {productName || productType || 'Virtual Try-On'}
            </Text>
            <Text style={styles.instructionText}>
              {FeatureFlags.ENABLE_FACE_MESH
                ? (faceDetected ? 'Face detected!' : 'Position your face in the frame')
                : 'Face mesh detection disabled'}
            </Text>
            {isDetecting && FeatureFlags.ENABLE_FACE_MESH && (
              <ActivityIndicator size="small" color="#fff" style={{ marginTop: 8 }} />
            )}
          </View>

          {/* Face Mesh Overlay - Only show if feature flag is enabled */}
          {FeatureFlags.ENABLE_FACE_MESH && renderFaceMesh()}

          {/* Status Indicator */}
          {FeatureFlags.ENABLE_FACE_MESH && !faceDetected && !isDetecting && (
            <View style={styles.statusOverlay}>
              <Text style={styles.statusText}>
                Waiting for face detection...
              </Text>
            </View>
          )}
        </View>
      </CameraView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Placeholder for capture/save button */}
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => {
            // TODO: Implement capture/save functionality
            console.log('Capture virtual try-on');
          }}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        {/* Placeholder for settings/adjustments button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => {
            // TODO: Implement settings/adjustments
            console.log('Open settings');
          }}
        >
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  productInfoOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  productName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
  },
  arPlaceholder: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  arPlaceholderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  arPlaceholderSubtext: {
    color: '#fff',
    fontSize: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#333',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  settingsButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  meshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  faceBoundingBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  landmarkPoint: {
    position: 'absolute',
    backgroundColor: '#00FF00',
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  // Class-based mesh point styles
  lipPoint: {
    position: 'absolute',
    backgroundColor: '#FF1493', // Deep pink for lips
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  eyePoint: {
    position: 'absolute',
    backgroundColor: '#0000FF', // Blue for eyes
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  facePoint: {
    position: 'absolute',
    backgroundColor: '#FFD700', // Gold for face
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  statusOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
  },
});

