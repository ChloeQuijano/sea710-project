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
import { detectProducts, getHealthStatus } from '../services/api';
import ProductCard from '../components/ProductCard';
import { normalizeClassName, getDisplayName } from '../utils/productClasses';
import { FeatureFlags, simulateMockDetection, AppConfig } from '../config/featureFlags';

// API URL configuration
const API_BASE_URL = __DEV__
  ? AppConfig.API_BASE_URL_DEV
  : AppConfig.API_BASE_URL_PROD;

const DETECTION_CONFIDENCE_THRESHOLD = AppConfig.DETECTION_CONFIDENCE_THRESHOLD;
const DETECTION_INTERVAL = AppConfig.DETECTION_INTERVAL;
const USE_MOCK_DETECTIONS = FeatureFlags.USE_MOCK_DETECTIONS;

// Transform API detection format to our Detection type
const transformDetection = (apiDetection, index) => {
  const bbox = apiDetection.bbox || {};
  
  // Normalize class name using enum
  const rawClassName = apiDetection.class_name || apiDetection.raw_class_name || 'Unknown';
  const normalizedClass = normalizeClassName(rawClassName);
  const displayName = apiDetection.display_name || getDisplayName(normalizedClass || rawClassName);
  
  return {
    id: `detection-${index}-${Date.now()}`,
    label: normalizedClass || rawClassName, // Use normalized enum value
    displayName: displayName, // Human-readable name
    // Use productName from API/mock if available, otherwise generate from displayName
    productName: apiDetection.productName || (displayName ? `${displayName} Product` : undefined),
    productImageUrl: apiDetection.productImageUrl || undefined,
    boundingBox: {
      x: bbox.x1 || 0,
      y: bbox.y1 || 0,
      width: (bbox.x2 || 0) - (bbox.x1 || 0),
      height: (bbox.y2 || 0) - (bbox.y1 || 0),
    },
    confidence: apiDetection.confidence || 0,
    // Use priceRange from API/mock if available
    priceRange: apiDetection.priceRange || undefined,
  };
};

export default function ScanProductScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState('back');
  const [detections, setDetections] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  // Initialize API status based on mock mode
  const [apiStatus, setApiStatus] = useState(USE_MOCK_DETECTIONS ? 'ready' : 'unknown');
  const [confidence] = useState(0.25);
  const cameraRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  useEffect(() => {
    // Skip API health check in mock mode
    if (!USE_MOCK_DETECTIONS) {
      checkApiHealth();
    } else {
      // Set status to 'ready' in mock mode so UI shows as ready
      setApiStatus('ready');
    }
    
    // Start continuous detection
    startContinuousDetection();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await getHealthStatus(API_BASE_URL);
      setApiStatus(health.model_loaded ? 'ready' : 'no_model');
    } catch (error) {
      setApiStatus('offline');
      console.error('API health check failed:', error);
    }
  };

  const startContinuousDetection = () => {
    detectionIntervalRef.current = setInterval(() => {
      // In mock mode, don't check API status
      if (USE_MOCK_DETECTIONS) {
        if (!isDetecting) {
          captureAndDetect();
        }
      } else if (!isDetecting && cameraRef.current && apiStatus === 'ready') {
        captureAndDetect();
      }
    }, DETECTION_INTERVAL);
  };

  const captureAndDetect = async () => {
    if (!USE_MOCK_DETECTIONS && (!cameraRef.current || isDetecting)) return;

    setIsDetecting(true);
    try {
      let result;

      // Use mock data for testing (when feature flag is enabled)
      if (USE_MOCK_DETECTIONS) {
        console.log('[MOCK MODE] Using mock detection data');
        result = await simulateMockDetection();
      } else {
        // Real API call
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
          skipProcessing: false,
        });

        result = await detectProducts(API_BASE_URL, photo.uri, confidence);
      }

      if (result.status === 'success' && result.detections) {
        const transformedDetections = result.detections
          .map((det, idx) => transformDetection(det, idx))
          .filter(det => det.confidence >= DETECTION_CONFIDENCE_THRESHOLD);

        setDetections(transformedDetections);

        // Auto-select highest confidence detection if none selected
        if (transformedDetections.length > 0 && !selectedProduct) {
          const highestConf = transformedDetections.reduce((prev, current) =>
            prev.confidence > current.confidence ? prev : current
          );
          setSelectedProduct(highestConf);
        }
      }
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleBoundingBoxPress = (detection) => {
    setSelectedProduct(detection);
  };

  const handleDismissCard = () => {
    setSelectedProduct(null);
  };

  const handleTryVirtualLook = (product) => {
    navigation.navigate('VirtualTryOn', {
      productType: product.label,
      productName: product.productName || product.label,
      productImageUrl: product.productImageUrl,
    });
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'ready':
        return '#4CAF50';
      case 'no_model':
        return '#FF9800';
      case 'offline':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'ready':
        return 'API Ready';
      case 'no_model':
        return 'No Model Loaded';
      case 'offline':
        return 'API Offline';
      default:
        return 'Checking...';
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
      
      {/* API Status Bar */}
      {!USE_MOCK_DETECTIONS && (
        <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {isDetecting && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
        </View>
      )}

      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        ratio="16:9"
      >
        <View style={styles.cameraOverlay}>
          {/* Helper Text Overlay */}
          {!selectedProduct && (
            <View style={styles.helperTextContainer}>
              <Text style={styles.helperText}>
                {USE_MOCK_DETECTIONS
                  ? 'MOCK MODE: Testing with sample detections'
                  : apiStatus === 'ready' 
                  ? isDetecting 
                    ? 'Detecting products...' 
                    : 'Point camera at a makeup product'
                  : apiStatus === 'no_model'
                  ? 'Waiting for model to load...'
                  : 'Connecting to server...'}
              </Text>
              {(USE_MOCK_DETECTIONS || (apiStatus === 'ready' && !isDetecting)) && (
                <Text style={styles.helperSubtext}>
                  Tap on detected products to view details
                </Text>
              )}
            </View>
          )}

          {/* Bounding Boxes Overlay */}
          {detections.map((detection) => {
            const { x, y, width, height } = detection.boundingBox;
            const isSelected = selectedProduct?.id === detection.id;
            
            return (
              <TouchableOpacity
                key={detection.id}
                style={[
                  styles.boundingBox,
                  {
                    left: x,
                    top: y,
                    width: width,
                    height: height,
                    borderColor: isSelected ? '#4CAF50' : '#FFD700',
                    borderWidth: isSelected ? 3 : 2,
                  },
                ]}
                onPress={() => handleBoundingBoxPress(detection)}
                activeOpacity={0.8}
              >
                <View style={styles.labelContainer}>
                  <Text style={styles.labelText} numberOfLines={1}>
                    {detection.displayName || detection.label}
                  </Text>
                  <Text style={styles.confidenceText}>
                    {(detection.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </CameraView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
        >
          <Text style={styles.controlButtonText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            setDetections([]);
            setSelectedProduct(null);
          }}
        >
          <Text style={styles.controlButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Product Card */}
      {selectedProduct && (
        <ProductCard
          product={selectedProduct}
          onDismiss={handleDismissCard}
          onTryVirtualLook={handleTryVirtualLook}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  statusBar: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  helperTextContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  helperText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  helperSubtext: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  boundingBox: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  labelContainer: {
    position: 'absolute',
    top: -25,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    maxWidth: 200,
  },
  labelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  confidenceText: {
    color: '#FFD700',
    fontSize: 10,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  controlButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  controlButtonText: {
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
});

