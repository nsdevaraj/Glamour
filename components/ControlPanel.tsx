import React, { useState } from 'react';
import { MakeupConfig, MakeupCategory } from '../types';

interface ControlPanelProps {
  config: MakeupConfig;
  updateConfig: (key: keyof MakeupConfig, value: string | number | boolean) => void;
  activeCategory: MakeupCategory;
  setActiveCategory: (cat: MakeupCategory) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  updateConfig,
  activeCategory,
  setActiveCategory,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const categories = Object.values(MakeupCategory);

  const renderColorControl = (label: string, colorKey: keyof MakeupConfig, opacityKey: keyof MakeupConfig) => (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
         <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
         <span className="text-xs text-gray-500">{Math.round((config[opacityKey] as number) * 100)}%</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative group">
            <div 
                className="w-10 h-10 rounded-full shadow-inner border border-white/10"
                style={{ backgroundColor: config[colorKey] as string }}
            />
            <input
            type="color"
            value={config[colorKey] as string}
            onChange={(e) => updateConfig(colorKey, e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
        
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config[opacityKey] as number}
            onChange={(e) => updateConfig(opacityKey, parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-pink-300 transition-all"
          />
        </div>
      </div>
    </div>
  );

  const renderSliderControl = (label: string, valueKey: keyof MakeupConfig) => (
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
           <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
           <span className="text-xs text-gray-500">{Math.round((config[valueKey] as number) * 100)}%</span>
        </div>
        <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config[valueKey] as number}
            onChange={(e) => updateConfig(valueKey, parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-pink-300 transition-all"
        />
      </div>
  );

  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
        <span className="text-sm font-medium text-white">{label}</span>
        <button 
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-pink-500' : 'bg-white/20'}`}
        >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
    </div>
  );

  return (
    <div className="h-full flex items-start p-4 pointer-events-auto">
      {/* Toggle Button for Panel Visibility */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`mr-4 p-3 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 text-white
            ${isOpen ? 'bg-black/40 hover:bg-black/60' : 'bg-black/20 hover:bg-black/40'}`}
      >
        {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        )}
      </button>

      {/* Main Glass Panel */}
      <div className={`
        flex flex-col w-80 max-h-[90vh] overflow-y-auto
        bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl
        transition-all duration-300 origin-top-left
        ${isOpen ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 -translate-x-10 pointer-events-none'}
      `}>
        
        <div className="p-6">
          <h1 className="text-xl font-light tracking-[0.2em] text-white uppercase mb-8 border-b border-white/10 pb-4">
            Glamour<span className="font-bold text-pink-400">AI</span>
          </h1>

          {/* Minimal Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-[10px] font-bold tracking-wider rounded-full transition-all whitespace-nowrap
                  ${activeCategory === cat 
                    ? 'bg-white text-black shadow-lg scale-105' 
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Controls Container */}
          <div className="space-y-2 animate-fade-in">
            {activeCategory === MakeupCategory.LIPS && (
               <>
                 <Toggle 
                   label="Lip Enhancement" 
                   checked={config.enableLips} 
                   onChange={(v) => updateConfig('enableLips', v)} 
                 />
                 <div className={`transition-opacity duration-300 ${config.enableLips ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    {renderColorControl('Lip Shade', 'lipColor', 'lipOpacity')}
                 </div>
                 
                 <div className="mt-6 pt-4 border-t border-white/10">
                     <Toggle 
                       label="Teeth Whitening" 
                       checked={config.enableTeeth} 
                       onChange={(v) => updateConfig('enableTeeth', v)} 
                     />
                     <div className={`transition-opacity duration-300 ${config.enableTeeth ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        {renderSliderControl('Intensity', 'teethWhiteness')}
                     </div>
                 </div>
               </>
            )}

            {activeCategory === MakeupCategory.EYES && (
              <>
                <Toggle 
                   label="Eye Makeup" 
                   checked={config.enableEyes} 
                   onChange={(v) => updateConfig('enableEyes', v)} 
                 />
                 <div className={`transition-opacity duration-300 ${config.enableEyes ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  {renderColorControl('Eyeshadow', 'eyeshadowColor', 'eyeshadowOpacity')}
                  {renderColorControl('Eyeliner', 'eyelinerColor', 'eyelinerOpacity')}
                </div>
              </>
            )}

            {activeCategory === MakeupCategory.FACE && (
              <>
                <Toggle 
                   label="Face Base" 
                   checked={config.enableFace} 
                   onChange={(v) => updateConfig('enableFace', v)} 
                 />
                 <div className={`transition-opacity duration-300 ${config.enableFace ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  {renderColorControl('Blush', 'blushColor', 'blushOpacity')}
                  {renderColorControl('Foundation', 'foundationTone', 'foundationOpacity')}
                </div>
              </>
            )}

            {activeCategory === MakeupCategory.HAIR && (
               <>
                 <Toggle 
                   label="Hair Tinting" 
                   checked={config.enableHair} 
                   onChange={(v) => updateConfig('enableHair', v)} 
                 />
                 <div className={`transition-opacity duration-300 ${config.enableHair ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    {renderColorControl('Hair Color', 'hairColor', 'hairOpacity')}
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                        *Effect depends on lighting and position. Best results when facing camera directly.
                    </p>
                 </div>
               </>
            )}

            {activeCategory === MakeupCategory.ACCESSORIES && (
              <>
               <Toggle 
                   label="Digital Accessories" 
                   checked={config.enableAccessories} 
                   onChange={(v) => updateConfig('enableAccessories', v)} 
                 />
                <div className={`transition-opacity duration-300 ${config.enableAccessories ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <div className="mb-5">
                     <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">Bindi Color</label>
                     <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div 
                                className="w-10 h-10 rounded-full shadow-inner border border-white/10"
                                style={{ backgroundColor: config.accessoryColor }}
                            />
                            <input
                            type="color"
                            value={config.accessoryColor}
                            onChange={(e) => updateConfig('accessoryColor', e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                     </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;