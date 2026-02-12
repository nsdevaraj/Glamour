import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = React.memo(({ label, checked, onChange }) => (
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
));

export default Toggle;
