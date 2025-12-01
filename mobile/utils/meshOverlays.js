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
  // Normalize product type - handle various formats
  const normalizedProductType = productType?.toLowerCase().trim();
  
  const meshRenderers = {
    // Lip products
    'lip stick': renderLipstickMesh,
    'lipstick': renderLipstickMesh,
    'lip gloss': renderLipstickMesh, // Same as lipstick
    'lipgloss': renderLipstickMesh,
    'lip liner': renderLipLinerMesh,
    'lipliner': renderLipLinerMesh,
    'lip balm': renderLipstickMesh, // Same as lipstick
    'lipbalm': renderLipstickMesh,
    
    // Face/base products
    'foundation': renderFoundationMesh,
    'concealer': renderConcealerMesh, // Specific to under eyes and around mouth
    'powder': renderFoundationMesh, // Similar to foundation
    'primer': renderFoundationMesh, // Similar to foundation
    
    // Eye products
    'eye liner': renderEyelinerMesh,
    'eyeliner': renderEyelinerMesh,
    'eye-liner': renderEyelinerMesh,
    'eye shadow': renderEyeshadowMesh,
    'eyeshadow': renderEyeshadowMesh,
    'eye-shadow': renderEyeshadowMesh,
    'mascara': renderMascaraMesh,
    
    // Cheek products
    'blush': renderBlushMesh,
    'bronzer': renderBlushMesh, // Similar to blush
    'highlighter': renderHighlighterMesh,
    
    // Add more product types as needed
  };

  const renderer = meshRenderers[normalizedProductType];
  
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
 * Returns filled semi-transparent layer for lips using proper outline
 */
const renderLipstickMesh = (landmarks, facialRegions, scalingParams) => {
  const { viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  const shapes = [];
  
  if (facialRegions) {
    // Use outer_lip if available (properly ordered for closed path)
    let lipPoints = [];
    
    if (facialRegions.outer_lip && facialRegions.outer_lip.length > 0) {
      // Use outer_lip which should already be in correct order
      lipPoints = facialRegions.outer_lip;
    } else if (facialRegions.upper_lip && facialRegions.lower_lip) {
      // Fallback: combine upper and lower lips
      // Upper lip from left to right, then lower lip from right to left to close the path
      const upperLip = facialRegions.upper_lip;
      const lowerLip = [...facialRegions.lower_lip].reverse(); // Reverse to go right to left
      lipPoints = [...upperLip, ...lowerLip];
    }
    
    if (lipPoints.length >= 3) {
      // Remove duplicate points (but keep order)
      const uniquePoints = [];
      const seen = new Set();
      const tolerance = 0.5; // Small tolerance for duplicate detection
      
      for (const point of lipPoints) {
        const key = `${Math.round(point.x / tolerance)},${Math.round(point.y / tolerance)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniquePoints.push(point);
        }
      }
      
      // Ensure we have at least 3 points for a valid polygon
      if (uniquePoints.length >= 3) {
        const pathPoints = uniquePoints.map((point) => {
          let scaledX = point.x * scaleX + offsetX;
          const scaledY = point.y * scaleY + offsetY;
          
          if (mirrorX) {
            scaledX = viewWidth - scaledX;
          }
          
          return { x: scaledX, y: scaledY };
        });
        
        // Log for debugging
        console.log('[Lip Mesh] Rendering lip overlay:', {
          totalPoints: lipPoints.length,
          uniquePoints: uniquePoints.length,
          hasOuterLip: !!facialRegions.outer_lip,
          outerLipCount: facialRegions.outer_lip?.length || 0,
          hasUpperLip: !!facialRegions.upper_lip,
          hasLowerLip: !!facialRegions.lower_lip,
        });
        
        shapes.push({
          key: 'lip-overlay',
          type: 'polygon',
          points: pathPoints,
          color: '#FF1493', // Deep pink
          opacity: 0.4,
          region: 'lips',
        });
      }
    } else {
      console.log('[Lip Mesh] Not enough lip points:', {
        lipPointsCount: lipPoints.length,
        hasOuterLip: !!facialRegions.outer_lip,
        outerLipCount: facialRegions.outer_lip?.length || 0,
        hasUpperLip: !!facialRegions.upper_lip,
        hasLowerLip: !!facialRegions.lower_lip,
      });
    }
  }
  
  return shapes;
};

/**
 * Render lip liner mesh overlay
 * Similar to lipstick but slightly more transparent
 */
const renderLipLinerMesh = (landmarks, facialRegions, scalingParams) => {
  const shapes = renderLipstickMesh(landmarks, facialRegions, scalingParams);
  // Make it slightly more transparent for liner
  return shapes.map(shape => ({ ...shape, opacity: 0.3 }));
};

/**
 * Render foundation mesh overlay
 * Returns filled semi-transparent layer for face
 * TODO: FIX
 */
const renderFoundationMesh = (landmarks, facialRegions, scalingParams) => {
  const { viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  const shapes = [];
  
  // Render face oval region as filled shape
  if (facialRegions && facialRegions.face_oval && facialRegions.face_oval.length > 0) {
    const pathPoints = facialRegions.face_oval.map((point) => {
      let scaledX = point.x * scaleX + offsetX;
      const scaledY = point.y * scaleY + offsetY;
      
      if (mirrorX) {
        scaledX = viewWidth - scaledX;
      }
      
      return { x: scaledX, y: scaledY };
    });
    
    shapes.push({
      key: 'face-overlay',
      type: 'polygon',
      points: pathPoints,
      color: '#FFD700', // Gold
      opacity: 0.3,
      region: 'face',
    });
  }
  
  return shapes;
};

/**
 * Render concealer mesh overlay
 * Returns filled semi-transparent layers for under-eye bags and around mouth
 * TODO: FIX
 */
const renderConcealerMesh = (landmarks, facialRegions, scalingParams) => {
  const { viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  const shapes = [];
  
  if (facialRegions) {
    // Under left eye
    if (facialRegions.left_under_eye && facialRegions.left_under_eye.length > 0) {
      const leftUnderEyePoints = facialRegions.left_under_eye.map((point) => {
        let scaledX = point.x * scaleX + offsetX;
        const scaledY = point.y * scaleY + offsetY;
        
        if (mirrorX) {
          scaledX = viewWidth - scaledX;
        }
        
        return { x: scaledX, y: scaledY };
      });
      
      shapes.push({
        key: 'left-under-eye-overlay',
        type: 'polygon',
        points: leftUnderEyePoints,
        color: '#FFD700', // Gold/beige for concealer
        opacity: 0.4,
        region: 'left-under-eye',
      });
    }
    
    // Under right eye
    if (facialRegions.right_under_eye && facialRegions.right_under_eye.length > 0) {
      const rightUnderEyePoints = facialRegions.right_under_eye.map((point) => {
        let scaledX = point.x * scaleX + offsetX;
        const scaledY = point.y * scaleY + offsetY;
        
        if (mirrorX) {
          scaledX = viewWidth - scaledX;
        }
        
        return { x: scaledX, y: scaledY };
      });
      
      shapes.push({
        key: 'right-under-eye-overlay',
        type: 'polygon',
        points: rightUnderEyePoints,
        color: '#FFD700', // Gold/beige for concealer
        opacity: 0.4,
        region: 'right-under-eye',
      });
    }
    
    // Around mouth area
    if (facialRegions.around_mouth && facialRegions.around_mouth.length > 0) {
      const aroundMouthPoints = facialRegions.around_mouth.map((point) => {
        let scaledX = point.x * scaleX + offsetX;
        const scaledY = point.y * scaleY + offsetY;
        
        if (mirrorX) {
          scaledX = viewWidth - scaledX;
        }
        
        return { x: scaledX, y: scaledY };
      });
      
      shapes.push({
        key: 'around-mouth-overlay',
        type: 'polygon',
        points: aroundMouthPoints,
        color: '#FFD700', // Gold/beige for concealer
        opacity: 0.4,
        region: 'around-mouth',
      });
    }
  }
  
  return shapes;
};

/**
 * Render eyeliner mesh overlay
 * Returns filled semi-transparent layers for eyes with proper outline
 * TODO: FIX
 */
const renderEyelinerMesh = (landmarks, facialRegions, scalingParams) => {
  const { viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  const shapes = [];
  
  if (facialRegions) {
    const leftEye = facialRegions.left_eye || [];
    const rightEye = facialRegions.right_eye || [];
    
    // Create overlay for left eye (points should already be ordered)
    if (leftEye.length >= 3) {
      const leftEyePoints = leftEye.map((point) => {
        let scaledX = point.x * scaleX + offsetX;
        const scaledY = point.y * scaleY + offsetY;
        
        if (mirrorX) {
          scaledX = viewWidth - scaledX;
        }
        
        return { x: scaledX, y: scaledY };
      });
      
      shapes.push({
        key: 'left-eye-overlay',
        type: 'polygon',
        points: leftEyePoints,
        color: '#0000FF', // Blue
        opacity: 0.35,
        region: 'left-eye',
      });
    }
    
    // Create overlay for right eye (points should already be ordered)
    if (rightEye.length >= 3) {
      const rightEyePoints = rightEye.map((point) => {
        let scaledX = point.x * scaleX + offsetX;
        const scaledY = point.y * scaleY + offsetY;
        
        if (mirrorX) {
          scaledX = viewWidth - scaledX;
        }
        
        return { x: scaledX, y: scaledY };
      });
      
      shapes.push({
        key: 'right-eye-overlay',
        type: 'polygon',
        points: rightEyePoints,
        color: '#0000FF', // Blue
        opacity: 0.35,
        region: 'right-eye',
      });
    }
  }
  
  return shapes;
};

/**
 * Render eyeshadow mesh overlay
 * Renders above the eyes (eyelid area) not on the eyes themselves
 * TODO: FIX
 */
const renderEyeshadowMesh = (landmarks, facialRegions, scalingParams) => {
  const { viewWidth, viewHeight, scaleX, scaleY, offsetX, offsetY, mirrorX } = scalingParams;
  const shapes = [];
  
  console.log('[Eyeshadow Mesh] Rendering eyeshadow:', {
    hasFacialRegions: !!facialRegions,
    hasLeftEyeshadow: !!facialRegions?.left_eyeshadow,
    leftEyeshadowCount: facialRegions?.left_eyeshadow?.length || 0,
    hasRightEyeshadow: !!facialRegions?.right_eyeshadow,
    rightEyeshadowCount: facialRegions?.right_eyeshadow?.length || 0,
    facialRegionsKeys: facialRegions ? Object.keys(facialRegions) : [],
  });
  
  if (facialRegions) {
    // Left eyeshadow area (above left eye)
    if (facialRegions.left_eyeshadow && facialRegions.left_eyeshadow.length >= 3) {
      const leftEyeshadowPoints = facialRegions.left_eyeshadow.map((point) => {
        let scaledX = point.x * scaleX + offsetX;
        const scaledY = point.y * scaleY + offsetY;
        
        if (mirrorX) {
          scaledX = viewWidth - scaledX;
        }
        
        return { x: scaledX, y: scaledY };
      });
      
      console.log('[Eyeshadow Mesh] Creating left eyeshadow overlay with', leftEyeshadowPoints.length, 'points');
      
      shapes.push({
        key: 'left-eyeshadow-overlay',
        type: 'polygon',
        points: leftEyeshadowPoints,
        color: '#8A2BE2', // Purple for eyeshadow
        opacity: 0.4,
        region: 'left-eyeshadow',
      });
    } else {
      console.log('[Eyeshadow Mesh] Left eyeshadow not available or insufficient points');
    }
    
    // Right eyeshadow area (above right eye)
    if (facialRegions.right_eyeshadow && facialRegions.right_eyeshadow.length >= 3) {
      const rightEyeshadowPoints = facialRegions.right_eyeshadow.map((point) => {
        let scaledX = point.x * scaleX + offsetX;
        const scaledY = point.y * scaleY + offsetY;
        
        if (mirrorX) {
          scaledX = viewWidth - scaledX;
        }
        
        return { x: scaledX, y: scaledY };
      });
      
      console.log('[Eyeshadow Mesh] Creating right eyeshadow overlay with', rightEyeshadowPoints.length, 'points');
      
      shapes.push({
        key: 'right-eyeshadow-overlay',
        type: 'polygon',
        points: rightEyeshadowPoints,
        color: '#8A2BE2', // Purple for eyeshadow
        opacity: 0.4,
        region: 'right-eyeshadow',
      });
    } else {
      console.log('[Eyeshadow Mesh] Right eyeshadow not available or insufficient points');
    }
  } else {
    console.log('[Eyeshadow Mesh] No facial regions available');
  }
  
  console.log('[Eyeshadow Mesh] Returning', shapes.length, 'shapes');
  return shapes;
};

/**
 * Render mascara mesh overlay
 * Similar to eyeliner but darker
 * TODO: FIX
 */
const renderMascaraMesh = (landmarks, facialRegions, scalingParams) => {
  const shapes = renderEyelinerMesh(landmarks, facialRegions, scalingParams);
  // Make it darker for mascara
  return shapes.map(shape => ({ ...shape, opacity: 0.4, color: '#000000' })); // Black for mascara
};

/**
 * Render blush mesh overlay
 * Focuses on cheek area - uses face region with pink tint
 * TODO: FIX
 */
const renderBlushMesh = (landmarks, facialRegions, scalingParams) => {
  const shapes = renderFoundationMesh(landmarks, facialRegions, scalingParams);
  // Make it pink for blush
  return shapes.map(shape => ({ ...shape, opacity: 0.35, color: '#FF69B4' })); // Hot pink for blush
};

/**
 * Render highlighter mesh overlay
 * Similar to foundation but with lighter, more transparent overlay
 * TODO: FIX
 */
const renderHighlighterMesh = (landmarks, facialRegions, scalingParams) => {
  const shapes = renderFoundationMesh(landmarks, facialRegions, scalingParams);
  // Make it lighter and more transparent for highlighter
  return shapes.map(shape => ({ ...shape, opacity: 0.25, color: '#FFFF00' })); // Yellow for highlighter
};

