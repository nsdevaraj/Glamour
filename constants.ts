// MediaPipe Face Mesh Landmark Indices
// These approximate the regions defined in the C++ Stasm code (LIPS, EYES, etc.)

export const FACEMESH_LIPS_UPPER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
export const FACEMESH_LIPS_LOWER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
export const FACEMESH_LIPS_FULL = [...FACEMESH_LIPS_UPPER, ...FACEMESH_LIPS_LOWER.reverse()];

export const FACEMESH_LIPS_INNER_UPPER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
export const FACEMESH_LIPS_INNER_LOWER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];
export const FACEMESH_LIPS_INNER = [...FACEMESH_LIPS_INNER_UPPER, ...FACEMESH_LIPS_INNER_LOWER.reverse()];

export const FACEMESH_LEFT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
export const FACEMESH_RIGHT_EYEBROW = [336, 296, 334, 293, 300, 276, 283, 282, 295, 285];

export const FACEMESH_LEFT_EYE_OUTLINE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
export const FACEMESH_RIGHT_EYE_OUTLINE = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249];

export const FACEMESH_LEFT_EYESHADOW = [33, 7, 163, 144, 145, 153, 154, 155, 133, 246, 161, 160, 159, 158, 157, 173]; // Simplified lid area
export const FACEMESH_RIGHT_EYESHADOW = [362, 263, 466, 388, 387, 386, 385, 384, 398, 382, 381, 380, 374, 373, 390, 249];

// Approximating the "Cheek Blush" logic from the C++ code
// The C++ code calculates a point between the nose and the side of the face.
// In MediaPipe, we can target specific mesh indices on the cheekbones.
export const FACEMESH_LEFT_CHEEK = [116, 117, 118, 100, 126, 209, 198, 50, 123, 147, 205];
export const FACEMESH_RIGHT_CHEEK = [345, 346, 347, 329, 355, 429, 420, 280, 352, 376, 425];

export const FACEMESH_FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

// Special Points for Accessories (Bindi)
export const LANDMARK_BINDI = 9; // Center of forehead
export const LANDMARK_NOSE_LEFT = 240; // Left Nostril
export const LANDMARK_EAR_LEFT = 132; // Left side of face near ear
export const LANDMARK_EAR_RIGHT = 361; // Right side of face near ear

export const DEFAULT_MAKEUP_CONFIG = {
  enableLips: true,
  lipColor: '#C2185B',
  lipOpacity: 0.2,
  enableTeeth: true, 
  teethWhiteness: 0.3,

  enableFace: true,
  blushColor: '#E91E63',
  blushOpacity: 0.2,
  foundationTone: '#F5DEB3',
  foundationOpacity: 0.05,
  
  enableEyes: true,
  eyeshadowColor: '#5D4037',
  eyeshadowOpacity: 0.1,
  eyelinerColor: '#000000',
  eyelinerOpacity: 0.1,

  enableHair: false,
  hairColor: '#4A3B32',
  hairOpacity: 0.4,
  
  enableAccessories: false,
  accessoryColor: '#FFD700',

  enableNoseRing: false,
  noseRingOpacity: 0.8,
  enableEarrings: false,
  earringsOpacity: 0.8
};
export const PRESET_COLORS = [
  '#C2185B', '#E91E63', '#D81B60', '#AD1457', // Pinks
  '#9C27B0', '#673AB7', '#4A148C', // Purples
  '#F44336', '#B71C1C', '#FF5722', // Reds
  '#795548', '#5D4037', '#3E2723', // Browns
  '#F5DEB3', '#D2B48C', // Skin tones
  '#000000', '#FFFFFF'
];
