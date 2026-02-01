import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  LANDMARK_BINDI
} from '../constants';

interface MakeoverCanvasProps {
  config: MakeupConfig;
}

const MakeoverCanvas: React.FC<MakeoverCanvasProps> = ({ config }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Comparison Slider State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

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
      return () => {
          isMountedRef.current = false;
      };
  }, []);

  // Helper to draw a shape with realistic smudged edges
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    indices: number[],
    color: string,
    opacity: number,
    baseBlur: number = 10,
    composite: GlobalCompositeOperation = 'multiply'
  ) => {
    if (opacity <= 0.01) return;

    const path = new Path2D();
    const firstPoint = landmarks[indices[0]];
    path.moveTo(firstPoint.x * ctx.canvas.width, firstPoint.y * ctx.canvas.height);
    for (let i = 1; i < indices.length; i++) {
      const p = landmarks[indices[i]];
      path.lineTo(p.x * ctx.canvas.width, p.y * ctx.canvas.height);
    }
    path.closePath();

    ctx.save();
    ctx.globalCompositeOperation = composite;
    
    // Layer 1: Wide diffuse smudge (soft edge)
    ctx.filter = `blur(${baseBlur}px)`;
    ctx.globalAlpha = opacity * 0.5;
    ctx.fillStyle = color;
    ctx.fill(path);

    // Layer 2: Inner definition (slightly more focused color)
    ctx.filter = `blur(${baseBlur * 0.5}px)`;
    ctx.globalAlpha = opacity * 0.5;
    ctx.fill(path);
    
    ctx.restore();
  };

  // Dedicated Lips Drawer with inner mouth hole and soft edges
  const drawLips = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    color: string,
    opacity: number
  ) => {
    if (opacity <= 0.01) return;

    // Create paths for outer and inner lips
    const outerPath = new Path2D();
    const outerIndices = FACEMESH_LIPS_FULL;
    const p0 = landmarks[outerIndices[0]];
    outerPath.moveTo(p0.x * ctx.canvas.width, p0.y * ctx.canvas.height);
    for (let i = 1; i < outerIndices.length; i++) {
        const p = landmarks[outerIndices[i]];
        outerPath.lineTo(p.x * ctx.canvas.width, p.y * ctx.canvas.height);
    }
    outerPath.closePath();

    const innerPath = new Path2D();
    const innerIndices = FACEMESH_LIPS_INNER;
    const pIn0 = landmarks[innerIndices[0]];
    innerPath.moveTo(pIn0.x * ctx.canvas.width, pIn0.y * ctx.canvas.height);
    for (let i = 1; i < innerIndices.length; i++) {
        const p = landmarks[innerIndices[i]];
        innerPath.lineTo(p.x * ctx.canvas.width, p.y * ctx.canvas.height);
    }
    innerPath.closePath();

    // Combine paths (Outer + Inner) for even-odd fill
    outerPath.addPath(innerPath);

    // Pass 1: Soft Light (Texture preservation, faint)
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.filter = 'blur(4px)'; 
    ctx.fill(outerPath, 'evenodd');
    ctx.restore();

    // Pass 2: Color Bleed (Smudged edge)
    ctx.save();
    ctx.globalAlpha = opacity * 0.6;
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'blur(6px)'; 
    ctx.fill(outerPath, 'evenodd');
    ctx.restore();
    
    // Pass 3: Core Color (Definition)
    ctx.save();
    ctx.globalAlpha = opacity * 0.4;
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'blur(2px)';
    ctx.fill(outerPath, 'evenodd');
    ctx.restore();
  };

  // Teeth Whitening: Fills the inner mouth area with white using 'soft-light'
  const drawTeeth = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    intensity: number
  ) => {
    if (intensity <= 0.01) return;

    const path = new Path2D();
    const indices = FACEMESH_LIPS_INNER;
    const p0 = landmarks[indices[0]];
    path.moveTo(p0.x * ctx.canvas.width, p0.y * ctx.canvas.height);
    for (let i = 1; i < indices.length; i++) {
      const p = landmarks[indices[i]];
      path.lineTo(p.x * ctx.canvas.width, p.y * ctx.canvas.height);
    }
    path.closePath();

    ctx.save();
    ctx.globalAlpha = intensity * 0.8; 
    ctx.fillStyle = '#FFFFFF';
    ctx.globalCompositeOperation = 'soft-light'; // Soft lightening
    ctx.filter = 'blur(3px)';
    ctx.fill(path);
    
    // Add a second pass for extra brightness if intensity is high
    if (intensity > 0.5) {
        ctx.globalAlpha = (intensity - 0.5) * 0.4;
        ctx.globalCompositeOperation = 'screen'; 
        ctx.fill(path);
    }
    
    ctx.restore();
  }

  // Hair Tinting: Extrudes the upper face oval to create a "halo" tint
  const drawHair = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    color: string,
    opacity: number
  ) => {
    if (opacity <= 0.01) return;

    // Center pivot (Nose bridge)
    const center = landmarks[168]; 
    if (!center) return;

    // Filter points from face oval that are roughly the hairline (above nose)
    // New Logic: Use topology to extract the exact hairline from ear to ear.
    // FACEMESH_FACE_OVAL is ordered: 10 (Top), ... 454 (Left Ear), ... 152 (Chin), ... 234 (Right Ear), ... 109.

    // Segment 1: Right Ear (234) -> Top (109). Indices 28..35
    const rightSideIndices = FACEMESH_FACE_OVAL.slice(28); // 234...109
    // Segment 2: Top (10) -> Left Ear (454). Indices 0..8
    const leftSideIndices = FACEMESH_FACE_OVAL.slice(0, 9); // 10...454

    // Combine to get continuous line: Right Ear -> Top -> Left Ear
    const hairlineIndices = [...rightSideIndices, ...leftSideIndices];
    const hairlinePoints = hairlineIndices.map(idx => landmarks[idx]);

    if (hairlinePoints.length < 5) return;

    // Create outer arc by expanding points from center with variable extrusion
    const outerPoints = hairlinePoints.map((p, i) => {
        const dx = p.x - center.x;
        const dy = p.y - center.y;

        // Calculate factor based on position in array.
        // Normalize index to 0..1 (0=Right Ear, 0.5=Top, 1=Left Ear)
        const t = i / (hairlinePoints.length - 1);

        // Parabolic curve for extrusion: Max at 0.5, Min at 0 and 1.
        // Formula: 4 * t * (1 - t) gives 0 at ends, 1 at center.
        const curve = 4 * t * (1 - t);

        // Base scale (sides) + Extra scale (top)
        // Sides: 1.3, Top: 1.3 + 1.5 = 2.8
        const scale = 1.3 + (1.5 * curve);

        return { 
            x: center.x + dx * scale, 
            y: center.y + dy * scale 
        };
    });

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    // 'color' blends hue/saturation while keeping luma (good for hair dye)
    // fallback to 'overlay' if strict color mode isn't desired
    ctx.globalCompositeOperation = 'color'; 
    ctx.filter = 'blur(15px)'; // Reduced blur slightly for better definition

    ctx.beginPath();
    // Inner curve (Hairline)
    const startP = hairlinePoints[0];
    ctx.moveTo(startP.x * ctx.canvas.width, startP.y * ctx.canvas.height);
    for (let i = 1; i < hairlinePoints.length; i++) {
        const p = hairlinePoints[i];
        ctx.lineTo(p.x * ctx.canvas.width, p.y * ctx.canvas.height);
    }
    // Outer curve (Top of head) - reverse order
    for (let i = outerPoints.length - 1; i >= 0; i--) {
        const p = outerPoints[i];
        ctx.lineTo(p.x * ctx.canvas.width, p.y * ctx.canvas.height);
    }
    ctx.closePath();
    ctx.fill();

    // Second pass for deeper color
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = opacity * 0.6;
    ctx.fill();

    ctx.restore();
  };

  // Helper to draw a stroke
  const drawStroke = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    indices: number[],
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
    // Slight blur for eyeliner so it looks applied, not vector-drawn
    ctx.filter = 'blur(2px)'; 
    
    ctx.beginPath();
    const firstPoint = landmarks[indices[0]];
    ctx.moveTo(firstPoint.x * ctx.canvas.width, firstPoint.y * ctx.canvas.height);

    for (let i = 1; i < indices.length; i++) {
      const point = landmarks[indices[i]];
      ctx.lineTo(point.x * ctx.canvas.width, point.y * ctx.canvas.height);
    }
    ctx.stroke();
    ctx.restore();
  };

  // Elliptical Blush with heavy smudge
  const drawBlush = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    indices: number[],
    color: string,
    opacity: number
  ) => {
    if (opacity <= 0.01) return;

    // 1. Calculate Centroid
    let sumX = 0, sumY = 0;
    const pts = indices.map(i => {
      const p = landmarks[i];
      return { x: p.x * ctx.canvas.width, y: p.y * ctx.canvas.height };
    });

    if (pts.length === 0) return;

    pts.forEach(p => {
      sumX += p.x;
      sumY += p.y;
    });
    
    const centerX = sumX / pts.length;
    const centerY = sumY / pts.length;

    // 2. Estimate Orientation and Size
    pts.sort((a, b) => a.x - b.x);
    const left = pts[0];
    const right = pts[pts.length - 1];
    
    const dx = right.x - left.x;
    const dy = right.y - left.y;
    const rotation = Math.atan2(dy, dx);
    const length = Math.sqrt(dx*dx + dy*dy);
    
    let minY = Infinity, maxY = -Infinity;
    pts.forEach(p => {
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    });
    const height = maxY - minY;

    ctx.save();
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = 'multiply'; 
    
    // Pass 1: Very wide dispersion
    ctx.globalAlpha = opacity * 0.4;
    ctx.filter = 'blur(25px)'; 
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, length * 0.6, height * 0.7, rotation, 0, 2 * Math.PI);
    ctx.fill();

    // Pass 2: Slightly more focused center
    ctx.globalAlpha = opacity * 0.6;
    ctx.filter = 'blur(15px)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, length * 0.4, height * 0.5, rotation, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  };

  const drawBindi = (ctx: CanvasRenderingContext2D, landmarks: any[], color: string) => {
      const center = landmarks[LANDMARK_BINDI];
      const noseTop = landmarks[168]; // Roughly between eyes
      
      const dy = center.y - noseTop.y;
      const size = Math.abs(dy * ctx.canvas.height) * 0.4;

      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      ctx.filter = 'blur(0.5px)'; // Slight softness to edge
      ctx.beginPath();
      ctx.arc(center.x * ctx.canvas.width, (center.y * ctx.canvas.height) - (size), size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
  }

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

      const currentConfig = configRef.current;
      const isCompare = isCompareModeRef.current;
      const sliderVal = sliderPosRef.current;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background from video frame
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      // Compare Split
      if (isCompare) {
        const percent = sliderVal / 100;
        const startX = canvas.width * (1 - percent);
        const regionWidth = canvas.width * percent;
        ctx.beginPath();
        ctx.rect(startX, 0, regionWidth, canvas.height);
        ctx.clip();
      }

      for (const landmarks of results.multiFaceLandmarks) {
        // 1. Foundation (High blur, subtle)
        if (currentConfig.enableFace) {
            drawShape(ctx, landmarks, FACEMESH_FACE_OVAL, currentConfig.foundationTone, currentConfig.foundationOpacity, 30, 'multiply');
            
            drawBlush(ctx, landmarks, FACEMESH_LEFT_CHEEK, currentConfig.blushColor, currentConfig.blushOpacity);
            drawBlush(ctx, landmarks, FACEMESH_RIGHT_CHEEK, currentConfig.blushColor, currentConfig.blushOpacity);
        }

        // 2. Eyes (Smudged edges)
        if (currentConfig.enableEyes) {
            // Eyeshadow - soft cloud
            drawShape(ctx, landmarks, FACEMESH_LEFT_EYESHADOW, currentConfig.eyeshadowColor, currentConfig.eyeshadowOpacity, 12, 'multiply');
            drawShape(ctx, landmarks, FACEMESH_RIGHT_EYESHADOW, currentConfig.eyeshadowColor, currentConfig.eyeshadowOpacity, 12, 'multiply');
            
            // Eyeliner - defined but not crisp
            drawStroke(ctx, landmarks, FACEMESH_LEFT_EYE_OUTLINE, currentConfig.eyelinerColor, currentConfig.eyelinerOpacity, 2.5);
            drawStroke(ctx, landmarks, FACEMESH_RIGHT_EYE_OUTLINE, currentConfig.eyelinerColor, currentConfig.eyelinerOpacity, 2.5);
        }
        
        // 3. Lips & Teeth
        if (currentConfig.enableLips) {
          if (currentConfig.enableTeeth) {
             drawTeeth(ctx, landmarks, currentConfig.teethWhiteness);
          }
          drawLips(ctx, landmarks, currentConfig.lipColor, currentConfig.lipOpacity);
        }
        
        // 4. Hair
        if (currentConfig.enableHair) {
            drawHair(ctx, landmarks, currentConfig.hairColor, currentConfig.hairOpacity);
        }
        
        // 5. Accessories
        if (currentConfig.enableAccessories) {
          drawBindi(ctx, landmarks, currentConfig.accessoryColor);
        }
      }
      
      ctx.restore();
    };

    const init = async () => {
        if (!isMountedRef.current) return;

        // Ensure global scripts are loaded
        if (!window.FaceMesh || !window.Camera) {
             setTimeout(init, 500);
             return;
        }

        try {
            faceMesh = new window.FaceMesh({locateFile: (file: string) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }});
            
            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            faceMesh.onResults(onResults);
            
            if (videoRef.current) {
                camera = new window.Camera(videoRef.current, {
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
};

export default MakeoverCanvas;