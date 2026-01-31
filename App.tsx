import React, { useState } from 'react';
import MakeoverCanvas from './components/MakeoverCanvas';
import ControlPanel from './components/ControlPanel';
import { MakeupConfig, MakeupCategory } from './types';
import { DEFAULT_MAKEUP_CONFIG } from './constants'

const App: React.FC = () => {
  const [makeupConfig, setMakeupConfig] = useState<MakeupConfig>(DEFAULT_MAKEUP_CONFIG);
  const [activeCategory, setActiveCategory] = useState<MakeupCategory>(MakeupCategory.LIPS);

  const handleConfigUpdate = (key: keyof MakeupConfig, value: string | number | boolean) => {
    setMakeupConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans">
      {/* Full Screen Camera Canvas */}
      <div className="absolute inset-0 z-0">
        <MakeoverCanvas config={makeupConfig} />
      </div>

      {/* Floating UI Overlay */}
      <div className="absolute inset-y-0 left-0 z-10 pointer-events-none">
         <ControlPanel 
            config={makeupConfig} 
            updateConfig={handleConfigUpdate}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
      </div>
    </div>
  );
};

export default App;