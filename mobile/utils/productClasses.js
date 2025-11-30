/**
 * Product class definitions and utilities for makeup product detection.
 */

/**
 * Enumeration of all makeup product classes that can be detected.
 */
export const ProductClass = {
  BEAUTY_BLENDER: 'beauty blender',
  BLUSH: 'blush',
  BRONZER: 'bronzer',
  BRUSH: 'brush',
  CONCEALER: 'concealer',
  EYE_LINER: 'eye liner',
  EYE_SHADOW: 'eye shadow',
  EYELASH_CURLER: 'eyelash curler',
  FOUNDATION: 'foundation',
  HIGHLIGHTER: 'highlighter',
  LIP_BALM: 'lip balm',
  LIP_GLOSS: 'lip gloss',
  LIP_LINER: 'lip liner',
  LIP_STICK: 'lip stick',
  MASCARA: 'mascara',
  NAIL_POLISH: 'nail polish',
  POWDER: 'powder',
  PRIMER: 'primer',
  SETTING_SPRAY: 'setting spray',
};

/**
 * Get all product class names as an array.
 * @returns {string[]} Array of all product class names
 */
export const getAllClasses = () => {
  return Object.values(ProductClass);
};

/**
 * Get the total number of product classes.
 * @returns {number} Number of product classes
 */
export const getClassCount = () => {
  return Object.keys(ProductClass).length;
};

/**
 * Convert model output string to ProductClass enum value.
 * 
 * Handles variations in naming:
 * - Case insensitive
 * - Handles spaces, hyphens, underscores
 * - Normalizes common variations
 * 
 * @param {string} className - Raw class name from model (e.g., "eye liner", "Eye Liner", "eye_liner")
 * @returns {string|null} ProductClass enum value if found, null otherwise
 * 
 * @example
 * normalizeClassName("eye liner") // returns "eye liner"
 * normalizeClassName("Lip Stick") // returns "lip stick"
 * normalizeClassName("eyelash_curler") // returns "eyelash curler"
 */
export const normalizeClassName = (className) => {
  if (!className || typeof className !== 'string') {
    return null;
  }

  // Normalize: lowercase, strip whitespace
  let normalized = className.toLowerCase().trim();

  // Replace common separators with spaces
  normalized = normalized.replace(/_/g, ' ').replace(/-/g, ' ');
  // Collapse multiple spaces
  normalized = normalized.split(/\s+/).join(' ');

  // Try direct match first
  const allClasses = getAllClasses();
  if (allClasses.includes(normalized)) {
    return normalized;
  }

  // Handle common variations
  const variations = {
    'eyeliner': ProductClass.EYE_LINER,
    'eye-liner': ProductClass.EYE_LINER,
    'eyeshadow': ProductClass.EYE_SHADOW,
    'eye-shadow': ProductClass.EYE_SHADOW,
    'lipstick': ProductClass.LIP_STICK,
    'lip-stick': ProductClass.LIP_STICK,
    'lipliner': ProductClass.LIP_LINER,
    'lip-liner': ProductClass.LIP_LINER,
    'lipgloss': ProductClass.LIP_GLOSS,
    'lip-gloss': ProductClass.LIP_GLOSS,
    'lipbalm': ProductClass.LIP_BALM,
    'lip-balm': ProductClass.LIP_BALM,
    'nailpolish': ProductClass.NAIL_POLISH,
    'nail-polish': ProductClass.NAIL_POLISH,
    'settingspray': ProductClass.SETTING_SPRAY,
    'beautyblender': ProductClass.BEAUTY_BLENDER,
    'beauty-blender': ProductClass.BEAUTY_BLENDER,
    'eyelashcurler': ProductClass.EYELASH_CURLER,
    'eyelash-curler': ProductClass.EYELASH_CURLER,
  };

  return variations[normalized] || null;
};

/**
 * Get a human-readable display name for a product class.
 * 
 * @param {string} productClass - ProductClass enum value
 * @returns {string} Formatted display name (e.g., "Eye Liner" instead of "eye liner")
 */
export const getDisplayName = (productClass) => {
  if (!productClass) return 'Unknown';
  
  // Split by space and capitalize each word
  return productClass
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Check if a class name string is a valid product class.
 * 
 * @param {string} className - Class name to validate
 * @returns {boolean} True if valid, False otherwise
 */
export const isValidClass = (className) => {
  return normalizeClassName(className) !== null;
};

