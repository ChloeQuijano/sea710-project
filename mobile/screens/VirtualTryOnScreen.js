/**
 * Virtual Try-On Selection Screen
 * Intermediate screen that displays product information and allows navigation to face camera
 * for virtual try-on experience
 */
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export default function VirtualTryOnScreen({ route, navigation }) {
  const { productType, productName, productImageUrl } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Product Header */}
        <View style={styles.header}>
          <Text style={styles.productName}>
            {productName || productType || 'Virtual Try-On'}
          </Text>
        </View>

        {/* Placeholder Content */}
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderTitle}>Virtual Try-On</Text>
          <Text style={styles.placeholderText}>
            Experience how this product looks on you
          </Text>
          <Text style={styles.placeholderDescription}>
            Use your front-facing camera to see how this product looks on your face in real-time.
          </Text>
        </View>

        {/* Start Camera Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            navigation.navigate('FaceCamera', {
              productType,
              productName,
              productImageUrl,
            });
          }}
        >
          <Text style={styles.startButtonText}>Start Virtual Try-On</Text>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What to Expect</Text>
          <Text style={styles.infoText}>
            • Real-time AR overlay of the product{'\n'}
            • See how it looks in different lighting{'\n'}
            • Try different shades and colors{'\n'}
            • Save your favorite looks
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  placeholderDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  infoSection: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

