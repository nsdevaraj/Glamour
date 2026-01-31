import React, { useState } from 'react';
import { MakeupConfig, MakeupCategory } from '../types';

interface ControlPanelProps {
  config: MakeupConfig;
  updateConfig: (key: keyof MakeupConfig, value: string | number | boolean) => void;
  activeCategory: MakeupCategory;
  setActiveCategory: (cat: MakeupCategory) => void;
}

const PRESET_COLORS = [
  '#C2185B', '#E91E63', '#D81B60', '#AD1457', // Pinks
  '#9C27B0', '#673AB7', '#4A148C', // Purples
  '#F44336', '#B71C1C', '#FF5722', // Reds
  '#795548', '#5D4037', '#3E2723', // Browns
  '#F5DEB3', '#D2B48C', // Skin tones
  '#000000', '#FFFFFF'
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  updateConfig,
  activeCategory,
  setActiveCategory,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const categories = Object.values(MakeupCategory);

  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300
            ${checked
                ? 'bg-pink-500/20 border-pink-500/50 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
    >
        <span className={`w-2 h-2 rounded-full ${checked ? 'bg-pink-500' : 'bg-gray-500'}`} />
        <span className="text-xs font-bold tracking-wider uppercase">{label}</span>
    </button>
  );

  const renderColorControl = (label: string, colorKey: keyof MakeupConfig, opacityKey: keyof MakeupConfig) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
         <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
         <span className="text-[10px] text-gray-500 font-mono">{Math.round((config[opacityKey] as number) * 100)}%</span>
      </div>
      
      {/* Opacity Slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={config[opacityKey] as number}
        onChange={(e) => updateConfig(opacityKey, parseFloat(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all focus:outline-none"
      />

      {/* Color Swatches */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <div className="relative group shrink-0">
            <div 
                className="w-8 h-8 rounded-full shadow-inner border border-white/20 flex items-center justify-center bg-gradient-to-br from-gray-700 to-black"
            >
               <span className="text-white text-xs">+</span>
            </div>
            <input
                type="color"
                value={config[colorKey] as string}
                onChange={(e) => updateConfig(colorKey, e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
        {PRESET_COLORS.map(color => (
            <button
                key={color}
                onClick={() => updateConfig(colorKey, color)}
                className={`w-8 h-8 rounded-full border shrink-0 transition-transform hover:scale-110 ${config[colorKey] === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
            />
        ))}
      </div>
    </div>
  );

  const renderSliderControl = (label: string, valueKey: keyof MakeupConfig) => (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
           <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
           <span className="text-[10px] text-gray-500 font-mono">{Math.round((config[valueKey] as number) * 100)}%</span>
        </div>
        <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config[valueKey] as number}
            onChange={(e) => updateConfig(valueKey, parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all focus:outline-none"
        />
      </div>
  );

  const renderActiveControls = () => {
      switch(activeCategory) {
          case MakeupCategory.LIPS:
              return (
                  <>
                    <div className="flex gap-4 mb-4">
                        <Toggle label="Lip Tint" checked={config.enableLips} onChange={(v) => updateConfig('enableLips', v)} />
                        <Toggle label="Whitening" checked={config.enableTeeth} onChange={(v) => updateConfig('enableTeeth', v)} />
                    </div>
                    {config.enableLips && renderColorControl('Lip Color', 'lipColor', 'lipOpacity')}
                    {config.enableTeeth && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            {renderSliderControl('Teeth Brightness', 'teethWhiteness')}
                        </div>
                    )}
                  </>
              );
          case MakeupCategory.EYES:
               return (
                  <>
                    <div className="mb-4">
                        <Toggle label="Eye Makeup" checked={config.enableEyes} onChange={(v) => updateConfig('enableEyes', v)} />
                    </div>
                    {config.enableEyes && (
                        <div className="space-y-6">
                            {renderColorControl('Eyeshadow', 'eyeshadowColor', 'eyeshadowOpacity')}
                            {renderColorControl('Eyeliner', 'eyelinerColor', 'eyelinerOpacity')}
                        </div>
                    )}
                  </>
              );
          case MakeupCategory.FACE:
               return (
                  <>
                    <div className="mb-4">
                        <Toggle label="Face Base" checked={config.enableFace} onChange={(v) => updateConfig('enableFace', v)} />
                    </div>
                    {config.enableFace && (
                        <div className="space-y-6">
                            {renderColorControl('Blush', 'blushColor', 'blushOpacity')}
                            {renderColorControl('Foundation', 'foundationTone', 'foundationOpacity')}
                        </div>
                    )}
                  </>
              );
          case MakeupCategory.HAIR:
              return (
                  <>
                    <div className="mb-4">
                        <Toggle label="Hair Tint" checked={config.enableHair} onChange={(v) => updateConfig('enableHair', v)} />
                    </div>
                    {config.enableHair && (
                        <div>
                             {renderColorControl('Hair Color', 'hairColor', 'hairOpacity')}
                             <p className="text-[10px] text-gray-500 mt-2 text-center opacity-60">
                                Best results with direct lighting
                             </p>
                        </div>
                    )}
                  </>
              );
           case MakeupCategory.ACCESSORIES:
               return (
                   <>
                     <div className="mb-4">
                        <Toggle label="Accessories" checked={config.enableAccessories} onChange={(v) => updateConfig('enableAccessories', v)} />
                     </div>
                     {config.enableAccessories && (
                         <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bindi Color</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                                <div className="relative group shrink-0">
                                    <div className="w-8 h-8 rounded-full shadow-inner border border-white/20 flex items-center justify-center bg-gradient-to-br from-gray-700 to-black">
                                        <span className="text-white text-xs">+</span>
                                    </div>
                                    <input
                                        type="color"
                                        value={config.accessoryColor}
                                        onChange={(e) => updateConfig('accessoryColor', e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => updateConfig('accessoryColor', color)}
                                        className={`w-8 h-8 rounded-full border shrink-0 transition-transform hover:scale-110 ${config.accessoryColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                         </div>
                     )}
                   </>
               )
          default:
              return null;
      }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center justify-end pb-6 px-4">

      {/* Visibility Toggle (Floating) */}
      <div className="pointer-events-auto absolute bottom-24 right-4 md:bottom-8 md:right-8 z-50">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-3 rounded-full backdrop-blur-xl border border-white/10 shadow-lg transition-all duration-300 text-white
                ${isOpen ? 'bg-black/40 hover:bg-black/60 rotate-0' : 'bg-pink-600/80 hover:bg-pink-500 rotate-180'}`}
          >
            {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            )}
          </button>
      </div>

      <div className={`
        flex flex-col items-center w-full max-w-lg mx-auto
        transition-all duration-500 ease-in-out
        ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}>

          {/* Controls Card */}
          <div className="w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl mb-4 pointer-events-auto animate-fade-in-up">
              {renderActiveControls()}
          </div>

          {/* Category Navigation Bar */}
          <div className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 pointer-events-auto shadow-xl flex justify-between items-center overflow-x-auto scrollbar-hide">
             {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-3 px-4 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap
                  ${activeCategory === cat 
                    ? 'bg-white text-black shadow-lg scale-100'
                    : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ControlPanel;