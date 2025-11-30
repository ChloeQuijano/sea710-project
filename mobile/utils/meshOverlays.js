/**
 * Mesh Overlay System
 * 
 * Handles rendering of different mesh overlays based on product class.
 * Each product class can have its own custom mesh overlay implementation.
 */

/**
 * Get facial regions from face mesh data
 * @param {Object} faceMeshData - Face mesh data from API
 * @returns {Object} Facial regions (lips, eyes, etc.)
 */
export const getFacialRegions = (faceMeshData) => {
  if (!faceMeshData || !faceMeshData.facial_regions) {
    return null;
  }
  return faceMeshData.facial_regions;
};

/**
 * Render mesh overlay for a specific product class
 * @param {Object} params - Rendering parameters
 * @param {string} productType - Product class name
 * @param {Object} faceMeshData - Face mesh data
 * @param {Object} scalingParams - Coordinate scaling parameters
 * @returns {React.Element} Mesh overlay component
 */
export const renderClassBasedMesh = (productType, faceMeshData, scalingParams) => {
  const { landmarks, viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  const facialRegions = getFacialRegions(faceMeshData);
  
  // Map product types to their mesh overlay renderers
  const meshRenderers = {
    'lip stick': renderLipstickMesh,
    'lip gloss': renderLipstickMesh, // Same as lipstick
    'lip liner': renderLipLinerMesh,
    'lip balm': renderLipstickMesh, // Same as lipstick
    'foundation': renderFoundationMesh,
    'concealer': renderFoundationMesh, // Similar to foundation
    'eye liner': renderEyelinerMesh,
    'eye shadow': renderEyeshadowMesh,
    'mascara': renderMascaraMesh,
    'blush': renderBlushMesh,
    'bronzer': renderBlushMesh, // Similar to blush
    'highlighter': renderHighlighterMesh,
    'powder': renderFoundationMesh, // Similar to foundation
    'primer': renderFoundationMesh, // Similar to foundation
    // Add more product types as needed
  };

  const renderer = meshRenderers[productType?.toLowerCase()];
  
  if (renderer) {
    return renderer(landmarks, facialRegions, scalingParams);
  }

  // Default: render all landmarks if no specific renderer
  return renderDefaultMesh(landmarks, scalingParams);
};

/**
 * Render default mesh (all landmarks as dots)
 * Returns array of point objects with coordinates and styling info
 */
export const renderDefaultMesh = (landmarks, scalingParams) => {
  const { viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  
  return landmarks.map((landmark, index) => {
    let scaledX = landmark.x * scaleX + offsetX;
    const scaledY = landmark.y * scaleY + offsetY;
    
    if (mirrorX) {
      scaledX = viewWidth - scaledX;
    }
    
    const margin = 10;
    if (scaledX < -margin || scaledX > viewWidth + margin || 
        scaledY < -margin || scaledY > viewHeight + margin) {
      return null;
    }
    
    return {
      key: `landmark-${index}`,
      x: scaledX - 1.5,
      y: scaledY - 1.5,
      type: 'landmark',
      size: 3,
    };
  }).filter(Boolean);
};

/**
 * Render lipstick mesh overlay
 * Focuses on lip region landmarks
 */
const renderLipstickMesh = (landmarks, facialRegions, scalingParams) => {
  const { viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  const meshPoints = [];
  
  // Render lip region landmarks
  if (facialRegions) {
    const upperLip = facialRegions.upper_lip || [];
    const lowerLip = facialRegions.lower_lip || [];
    
    [...upperLip, ...lowerLip].forEach((point, index) => {
      let scaledX = point.x * scaleX + offsetX;
      const scaledY = point.y * scaleY + offsetY;
      
      if (mirrorX) {
        scaledX = viewWidth - scaledX;
      }
      
      meshPoints.push({
        key: `lip-${index}`,
        x: scaledX - 2,
        y: scaledY - 2,
        type: 'lip',
        size: 3,
      });
    });
  }
  
  return meshPoints;
};

/**
 * Render lip liner mesh overlay
 * Focuses on lip outline
 */
const renderLipLinerMesh = (landmarks, facialRegions, scalingParams) => {
  // Similar to lipstick but with different styling
  return renderLipstickMesh(landmarks, facialRegions, scalingParams);
};

/**
 * Render foundation mesh overlay
 * Covers face area
 */
const renderFoundationMesh = (landmarks, facialRegions, scalingParams) => {
  const { viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  const meshPoints = [];
  
  // Render face oval region
  if (facialRegions && facialRegions.face_oval) {
    facialRegions.face_oval.forEach((point, index) => {
      let scaledX = point.x * scaleX + offsetX;
      const scaledY = point.y * scaleY + offsetY;
      
      if (mirrorX) {
        scaledX = viewWidth - scaledX;
      }
      
      meshPoints.push({
        key: `face-${index}`,
        x: scaledX - 1.5,
        y: scaledY - 1.5,
        type: 'face',
        size: 2,
      });
    });
  }
  
  return meshPoints;
};

/**
 * Render eyeliner mesh overlay
 * Focuses on eye region
 */
const renderEyelinerMesh = (landmarks, facialRegions, scalingParams) => {
  const { viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  const meshPoints = [];
  
  if (facialRegions) {
    const leftEye = facialRegions.left_eye || [];
    const rightEye = facialRegions.right_eye || [];
    
    [...leftEye, ...rightEye].forEach((point, index) => {
      let scaledX = point.x * scaleX + offsetX;
      const scaledY = point.y * scaleY + offsetY;
      
      if (mirrorX) {
        scaledX = viewWidth - scaledX;
      }
      
      meshPoints.push({
        key: `eye-${index}`,
        x: scaledX - 2,
        y: scaledY - 2,
        type: 'eye',
        size: 2.5,
      });
    });
  }
  
  return meshPoints;
};

/**
 * Render eyeshadow mesh overlay
 * Similar to eyeliner but covers more area
 */
const renderEyeshadowMesh = (landmarks, facialRegions, scalingParams) => {
  // Similar to eyeliner but with more coverage
  return renderEyelinerMesh(landmarks, facialRegions, scalingParams);
};

/**
 * Render mascara mesh overlay
 * Focuses on eyelash area
 */
const renderMascaraMesh = (landmarks, facialRegions, scalingParams) => {
  // Similar to eyeliner
  return renderEyelinerMesh(landmarks, facialRegions, scalingParams);
};

/**
 * Render blush mesh overlay
 * Focuses on cheek area
 */
const renderBlushMesh = (landmarks, facialRegions, scalingParams) => {
  // For now, use face region similar to foundation
  return renderFoundationMesh(landmarks, facialRegions, scalingParams);
};

/**
 * Render highlighter mesh overlay
 * Focuses on high points of face
 */
const renderHighlighterMesh = (landmarks, facialRegions, scalingParams) => {
  // Similar to foundation but with different styling
  return renderFoundationMesh(landmarks, facialRegions, scalingParams);
};

