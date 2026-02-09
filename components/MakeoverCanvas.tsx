import React, { useRef, useEffect, useState } from 'react';
import { MakeupConfig } from '../types';
import {
  FACEMESH_LIPS_FULL,
  FACEMESH_LIPS_INNER,
  FACEMESH_LEFT_EYESHADOW,
  FACEMESH_RIGHT_EYESHADOW,
  FACEMESH_LEFT_CHEEK,
  FACEMESH_RIGHT_CHEEK,
  FACEMESH_FACE_OVAL,
  FACEMESH_LEFT_EYE_OUTLINE,
  FACEMESH_RIGHT_EYE_OUTLINE,
  LANDMARK_BINDI,
  LANDMARK_NOSE_LEFT,
  LANDMARK_EAR_LEFT,
  LANDMARK_EAR_RIGHT
} from '../constants';
import { NOSE_RING_B64, EARRING_B64 } from './assets';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface MakeoverCanvasProps {
  config: MakeupConfig;
}

// Optimization: Pre-calculate indices to avoid slicing/spreading every frame
const HAIRLINE_INDICES = [
  ...FACEMESH_FACE_OVAL.slice(28), // Right Ear (234) -> Top
  ...FACEMESH_FACE_OVAL.slice(0, 9)  // Top -> Left Ear (454)
];

// --- Drawing Helpers (Moved outside component to avoid re-creation & optimize GC) ---

// Helper to convert hex to rgba string
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const drawShapes = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: any[],
  shapesIndices: number[][],
  color: string,
  opacity: number,
  baseBlur: number = 10,
  composite: GlobalCompositeOperation = 'multiply'
) => {
  if (opacity <= 0.01) return;

  ctx.beginPath();
  for (const indices of shapesIndices) {
      if (indices.length === 0) continue;
      const firstPoint = landmarks[indices[0]];
      ctx.moveTo(firstPoint.x * w, firstPoint.y * h);
      for (let i = 1; i < indices.length; i++) {
        const p = landmarks[indices[i]];
        ctx.lineTo(p.x * w, p.y * h);
      }
      ctx.closePath();
  }

  ctx.save();
  ctx.globalCompositeOperation = composite;
  // Bolt: Hoisted invariant properties
  ctx.globalAlpha = opacity * 0.5;
  ctx.fillStyle = color;

  // Layer 1: Wide diffuse smudge (soft edge)
  ctx.filter = `blur(${baseBlur}px)`;
  ctx.fill();

  // Layer 2: Inner definition (slightly more focused color)
  ctx.filter = `blur(${baseBlur * 0.5}px)`;
  ctx.fill();

  ctx.restore();
};

const drawLips = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: any[],
  color: string,
  opacity: number
) => {
  if (opacity <= 0.01) return;

  ctx.beginPath();

  // Outer lips
  const outerIndices = FACEMESH_LIPS_FULL;
  const p0 = landmarks[outerIndices[0]];
  ctx.moveTo(p0.x * w, p0.y * h);
  for (let i = 1; i < outerIndices.length; i++) {
      const p = landmarks[outerIndices[i]];
      ctx.lineTo(p.x * w, p.y * h);
  }
  ctx.closePath();

  // Inner lips (hole)
  const innerIndices = FACEMESH_LIPS_INNER;
  const pIn0 = landmarks[innerIndices[0]];
  ctx.moveTo(pIn0.x * w, pIn0.y * h);
  for (let i = 1; i < innerIndices.length; i++) {
      const p = landmarks[innerIndices[i]];
      ctx.lineTo(p.x * w, p.y * h);
  }
  ctx.closePath();

  // Bolt: Consolidated save/restore to reduce Canvas API overhead
  ctx.save();
  ctx.fillStyle = color;

  // Pass 1: Soft Light (Texture preservation, faint)
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.filter = 'blur(4px)';
  ctx.fill('evenodd');

  // Pass 2: Color Bleed (Smudged edge)
  ctx.globalAlpha = opacity * 0.6;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'blur(6px)';
  ctx.fill('evenodd');

  // Pass 3: Core Color (Definition)
  ctx.globalAlpha = opacity * 0.4;
  // Composite is already 'source-over'
  ctx.filter = 'blur(2px)';
  ctx.fill('evenodd');

  ctx.restore();
};

const drawTeeth = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: any[],
  intensity: number
) => {
  if (intensity <= 0.01) return;

  ctx.beginPath();
  const indices = FACEMESH_LIPS_INNER;
  const p0 = landmarks[indices[0]];
  ctx.moveTo(p0.x * w, p0.y * h);
  for (let i = 1; i < indices.length; i++) {
    const p = landmarks[indices[i]];
    ctx.lineTo(p.x * w, p.y * h);
  }
  ctx.closePath();

  ctx.save();
  ctx.globalAlpha = intensity * 0.8;
  ctx.fillStyle = '#FFFFFF';
  ctx.globalCompositeOperation = 'soft-light'; // Soft lightening
  ctx.filter = 'blur(3px)';
  ctx.fill();

  // Add a second pass for extra brightness if intensity is high
  if (intensity > 0.5) {
      ctx.globalAlpha = (intensity - 0.5) * 0.4;
      ctx.globalCompositeOperation = 'screen';
      ctx.fill();
  }

  ctx.restore();
}

// Optimization: Avoid allocation of intermediate arrays/objects
const drawHair = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: any[],
  color: string,
  opacity: number
) => {
  if (opacity <= 0.01) return;

  const center = landmarks[168];
  if (!center) return;

  if (HAIRLINE_INDICES.length < 5) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  // 'color' blends hue/saturation while keeping luma (good for hair dye)
  ctx.globalCompositeOperation = 'color';
  ctx.filter = 'blur(15px)';

  ctx.beginPath();

  // Inner curve (Hairline)
  const startP = landmarks[HAIRLINE_INDICES[0]];
  ctx.moveTo(startP.x * w, startP.y * h);
  for (let i = 1; i < HAIRLINE_INDICES.length; i++) {
      const p = landmarks[HAIRLINE_INDICES[i]];
      ctx.lineTo(p.x * w, p.y * h);
  }

  // Outer curve (Top of head) - reverse order, computed on fly
  const len = HAIRLINE_INDICES.length;
  for (let i = len - 1; i >= 0; i--) {
      const p = landmarks[HAIRLINE_INDICES[i]];
      const dx = p.x - center.x;
      const dy = p.y - center.y;

      const t = i / (len - 1);
      const curve = 4 * t * (1 - t);
      const scale = 1.3 + (1.5 * curve);

      const x = center.x + dx * scale;
      const y = center.y + dy * scale;

      ctx.lineTo(x * w, y * h);
  }
  ctx.closePath();
  ctx.fill();

  // Second pass for deeper color
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = opacity * 0.6;
  ctx.fill();

  ctx.restore();
};

const drawStrokes = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: any[],
  shapesIndices: number[][],
  color: string,
  opacity: number,
  width: number = 2
) => {
  if (opacity <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.filter = 'blur(2px)';

  ctx.beginPath();
  for (const indices of shapesIndices) {
      if (indices.length === 0) continue;
      const firstPoint = landmarks[indices[0]];
      ctx.moveTo(firstPoint.x * w, firstPoint.y * h);

      for (let i = 1; i < indices.length; i++) {
        const point = landmarks[indices[i]];
        ctx.lineTo(point.x * w, point.y * h);
      }
  }
  ctx.stroke();
  ctx.restore();
};

// Optimization: Avoid allocation of 'pts' array and sorting
const drawBlushes = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: any[],
  shapesIndices: number[][],
  color: string,
  opacity: number
) => {
  if (opacity <= 0.01) return;

  // Pre-calculate all ellipse parameters
  const ellipses = [];

  for (const indices of shapesIndices) {
      if (indices.length === 0) continue;

      let sumX = 0, sumY = 0;
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let pLeftX = 0, pLeftY = 0;
      let pRightX = 0, pRightY = 0;

      const len = indices.length;

      for (const i of indices) {
        const p = landmarks[i];
        const x = p.x * w;
        const y = p.y * h;

        sumX += x;
        sumY += y;

        if (x < minX) {
            minX = x;
            pLeftX = x;
            pLeftY = y;
        }
        if (x > maxX) {
            maxX = x;
            pRightX = x;
            pRightY = y;
        }

        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      const centerX = sumX / len;
      const centerY = sumY / len;

      const dx = pRightX - pLeftX;
      const dy = pRightY - pLeftY;
      const rotation = Math.atan2(dy, dx);
      const length = Math.sqrt(dx*dx + dy*dy);
      const height = maxY - minY;

      ellipses.push({ centerX, centerY, length, height, rotation });
  }

  if (ellipses.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';

  for (const e of ellipses) {
    // Bolt Optimization: Use RadialGradient instead of expensive ctx.filter='blur()'

    // Pass 1: Wide dispersion
    // Original: ellipse(rx, ry) with blur(25px)
    const rx1 = e.length * 0.6;
    const ry1 = e.height * 0.7;
    const blur1 = 25;
    const totalR1 = rx1 + blur1;

    ctx.save();
    ctx.translate(e.centerX, e.centerY);
    ctx.rotate(e.rotation);
    ctx.scale(1, ry1 / rx1); // Scale Y to match aspect ratio

    const grad1 = ctx.createRadialGradient(0, 0, 0, 0, 0, totalR1);
    const color1 = hexToRgba(color, opacity * 0.4);
    const colorTransparent = hexToRgba(color, 0);

    grad1.addColorStop(0, color1);
    // Solid core approximation
    grad1.addColorStop(Math.max(0, rx1 / totalR1), color1);
    grad1.addColorStop(1, colorTransparent);

    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(0, 0, totalR1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Pass 2: Slightly more focused center
    // Original: ellipse(rx, ry) with blur(15px)
    const rx2 = e.length * 0.4;
    const ry2 = e.height * 0.5;
    const blur2 = 15;
    const totalR2 = rx2 + blur2;

    ctx.save();
    ctx.translate(e.centerX, e.centerY);
    ctx.rotate(e.rotation);
    ctx.scale(1, ry2 / rx2);

    const grad2 = ctx.createRadialGradient(0, 0, 0, 0, 0, totalR2);
    const color2 = hexToRgba(color, opacity * 0.6);

    grad2.addColorStop(0, color2);
    grad2.addColorStop(Math.max(0, rx2 / totalR2), color2);
    grad2.addColorStop(1, colorTransparent);

    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(0, 0, totalR2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
};

const drawBindi = (ctx: CanvasRenderingContext2D, w: number, h: number, landmarks: any[], color: string) => {
    const center = landmarks[LANDMARK_BINDI];
    const noseTop = landmarks[168]; // Roughly between eyes
    
    const dy = center.y - noseTop.y;
    const size = Math.abs(dy * h) * 0.4;

    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 2;
    ctx.filter = 'blur(0.5px)'; // Slight softness to edge
    ctx.beginPath();
    ctx.arc(center.x * w, (center.y * h) - (size), size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

const drawNoseRing = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: any[],
  opacity: number,
  img: HTMLImageElement | null
) => {
  if (opacity <= 0.01 || !img) return;

  const nosePoint = landmarks[LANDMARK_NOSE_LEFT];
  const leftFace = landmarks[234];
  const rightFace = landmarks[454];
  if (!leftFace || !rightFace || !nosePoint) return;

  const faceWidth = Math.sqrt(Math.pow(rightFace.x - leftFace.x, 2) + Math.pow(rightFace.y - leftFace.y, 2));

  // Scale factor
  const size = faceWidth * w * 0.12;
  const x = nosePoint.x * w - size / 2;
  const y = nosePoint.y * h - size / 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
};

const drawEarrings = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: any[],
  opacity: number,
  img: HTMLImageElement | null
) => {
  if (opacity <= 0.01 || !img) return;

  const leftFace = landmarks[234];
  const rightFace = landmarks[454];
  if (!leftFace || !rightFace) return;

  const faceWidth = Math.sqrt(Math.pow(rightFace.x - leftFace.x, 2) + Math.pow(rightFace.y - leftFace.y, 2));
  const size = faceWidth * w * 0.15;

  // Left Ear Area
  const pLeft = landmarks[LANDMARK_EAR_LEFT];
  if (pLeft) {
       // Offset slightly outwards relative to face center
       const xLeft = pLeft.x * w - size/2 - (faceWidth * w * 0.05);
       const yLeft = pLeft.y * h;
       ctx.save();
       ctx.globalAlpha = opacity;
       ctx.drawImage(img, xLeft, yLeft, size, size);
       ctx.restore();
  }

  // Right Ear Area
  const pRight = landmarks[LANDMARK_EAR_RIGHT];
  if (pRight) {
       const xRight = pRight.x * w - size/2 + (faceWidth * w * 0.05);
       const yRight = pRight.y * h;
       ctx.save();
       ctx.globalAlpha = opacity;
       ctx.drawImage(img, xRight, yRight, size, size);
       ctx.restore();
  }
};

const MakeoverCanvas: React.FC<MakeoverCanvasProps> = React.memo(({ config }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Comparison Slider State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // Asset refs
  const noseRingImg = useRef<HTMLImageElement | null>(null);
  const earringImg = useRef<HTMLImageElement | null>(null);

  // Refs for animation loop access
  const configRef = useRef(config);
  const sliderPosRef = useRef(sliderPos);
  const isCompareModeRef = useRef(isCompareMode);
  const isMountedRef = useRef(true);

  useEffect(() => {
    configRef.current = config;
    sliderPosRef.current = sliderPos;
    isCompareModeRef.current = isCompareMode;
  }, [config, sliderPos, isCompareMode]);

  useEffect(() => {
      isMountedRef.current = true;

      // Load assets
      const img1 = new Image();
      img1.src = 'data:image/png;base64,' + NOSE_RING_B64;
      noseRingImg.current = img1;

      const img2 = new Image();
      img2.src = 'data:image/png;base64,' + EARRING_B64;
      earringImg.current = img2;

      return () => {
          isMountedRef.current = false;
      };
  }, []);

  useEffect(() => {
    let faceMesh: any;
    let camera: any;

    const onResults = (results: any) => {
      if (!isMountedRef.current) return;
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video || !results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        // Even if no faces, we should draw the video frame
        if (canvas && video && results.image) {
             const ctx = canvas.getContext('2d', { alpha: false });
             if (ctx) {
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
             }
        }
        return;
      }

      const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for frequent redraws
      if (!ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      // Bolt: Hoist canvas dimensions to avoid repeated DOM access in drawing loops
      const w = canvas.width;
      const h = canvas.height;

      const currentConfig = configRef.current;
      const isCompare = isCompareModeRef.current;
      const sliderVal = sliderPosRef.current;

      ctx.save();
      
      // Draw background from video frame
      ctx.drawImage(results.image, 0, 0, w, h);

      // Compare Split
      if (isCompare) {
        const percent = sliderVal / 100;
        const startX = w * (1 - percent);
        const regionWidth = w * percent;
        ctx.beginPath();
        ctx.rect(startX, 0, regionWidth, h);
        ctx.clip();
      }

      for (const landmarks of results.multiFaceLandmarks) {
        // 1. Foundation (High blur, subtle)
        if (currentConfig.enableFace) {
            drawShapes(ctx, w, h, landmarks, [FACEMESH_FACE_OVAL], currentConfig.foundationTone, currentConfig.foundationOpacity, 30, 'multiply');
            
            drawBlushes(ctx, w, h, landmarks, [FACEMESH_LEFT_CHEEK, FACEMESH_RIGHT_CHEEK], currentConfig.blushColor, currentConfig.blushOpacity);
        }

        // 2. Eyes (Smudged edges)
        if (currentConfig.enableEyes) {
            // Eyeshadow - soft cloud
            drawShapes(ctx, w, h, landmarks, [FACEMESH_LEFT_EYESHADOW, FACEMESH_RIGHT_EYESHADOW], currentConfig.eyeshadowColor, currentConfig.eyeshadowOpacity, 12, 'multiply');
            
            // Eyeliner - defined but not crisp
            drawStrokes(ctx, w, h, landmarks, [FACEMESH_LEFT_EYE_OUTLINE, FACEMESH_RIGHT_EYE_OUTLINE], currentConfig.eyelinerColor, currentConfig.eyelinerOpacity, 2.5);
        }
        
        // 3. Lips & Teeth
        if (currentConfig.enableLips) {
          if (currentConfig.enableTeeth) {
             drawTeeth(ctx, w, h, landmarks, currentConfig.teethWhiteness);
          }
          drawLips(ctx, w, h, landmarks, currentConfig.lipColor, currentConfig.lipOpacity);
        }
        
        // 4. Hair
        if (currentConfig.enableHair) {
            drawHair(ctx, w, h, landmarks, currentConfig.hairColor, currentConfig.hairOpacity);
        }
        
        // 5. Accessories
        if (currentConfig.enableAccessories) {
          drawBindi(ctx, w, h, landmarks, currentConfig.accessoryColor);
        }
        if (currentConfig.enableNoseRing) {
            drawNoseRing(ctx, w, h, landmarks, currentConfig.noseRingOpacity, noseRingImg.current);
        }
        if (currentConfig.enableEarrings) {
            drawEarrings(ctx, w, h, landmarks, currentConfig.earringsOpacity, earringImg.current);
        }
      }
      
      ctx.restore();
    };

    const init = async () => {
        if (!isMountedRef.current) return;

        try {
            faceMesh = new FaceMesh({locateFile: (file: string) => {
                return `/models/face_mesh/${file}`;
            }});
            
            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            faceMesh.onResults(onResults);
            
            if (videoRef.current) {
                camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (videoRef.current) {
                            await faceMesh.send({image: videoRef.current});
                        }
                    },
                    width: 1280,
                    height: 720
                });
                
                await camera.start();
                setModelLoaded(true);
            }
        } catch (err) {
            console.error(err);
            setCameraError("Failed to initialize camera or models.");
        }
    };
    
    init();

    return () => {
       isMountedRef.current = false;
       if (camera) camera.stop();
       if (faceMesh) faceMesh.close();
    };
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(percent);
  };

  return (
    <div 
      className="relative w-full h-full select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <video
        ref={videoRef}
        className="absolute opacity-0 pointer-events-none -z-10" // Hidden visually but active in DOM
        playsInline
        muted
        autoPlay
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
      />
      
      {isCompareMode && (
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize z-50 shadow-lg backdrop-blur-sm"
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-md">
             <div className="w-4 h-4 border-l-2 border-r-2 border-gray-600" />
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-50">
        <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-bold tracking-[0.2em] transition-all duration-300 backdrop-blur-xl border
              ${isCompareMode
                ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-105'
                : 'bg-black/20 text-white/60 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'}`}
        >
            COMPARE
        </button>
      </div>

       {(!modelLoaded || cameraError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-[60]">
            <div className="text-white text-center p-6">
                {cameraError ? (
                    <>
                        <div className="text-red-500 text-4xl mb-4">📷</div>
                        <h3 className="text-xl font-bold mb-2">Camera Access Error</h3>
                        <p className="text-sm opacity-80 max-w-md mb-2">{cameraError}</p>
                        <p className="text-xs text-gray-500">
                           Check your browser permissions for the camera.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-medium tracking-widest uppercase text-pink-500">Loading AI Models</p>
                    </>
                )}
            </div>
        </div>
       )}
    </div>
  );
});

export default MakeoverCanvas;
