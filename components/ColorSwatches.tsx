import React from 'react';
import { PRESET_COLORS } from '../constants';

interface ColorSwatchesProps {
  color: string;
  onColorChange: (color: string) => void;
}

const ColorSwatches: React.FC<ColorSwatchesProps> = React.memo(({ color, onColorChange }) => (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <div className="relative group shrink-0">
            <div
                className="w-8 h-8 rounded-full shadow-inner border border-white/20 flex items-center justify-center bg-gradient-to-br from-gray-700 to-black"
            >
               <span className="text-white text-xs">+</span>
            </div>
            <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
        {PRESET_COLORS.map(preset => (
            <button
                key={preset}
                onClick={() => onColorChange(preset)}
                className={`w-8 h-8 rounded-full border shrink-0 transition-transform hover:scale-110 ${color === preset ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                style={{ backgroundColor: preset }}
            />
        ))}
      </div>
));

export default ColorSwatches;
