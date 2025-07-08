import React from 'react';
import { ThemeName, themes } from '../themes';
import { PaletteIcon } from './IconComponents';

interface ThemeSelectorProps {
    currentTheme: ThemeName;
    setTheme: (theme: ThemeName) => void;
}

const themeDisplayNames: Record<ThemeName, string> = {
    'dark-blue': 'Dark Blue',
    'light': 'Light',
    'midnight': 'Midnight',
};

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, setTheme }) => {
    return (
        <div className="relative group">
            <button className="p-2 rounded-full bg-surface hover:bg-surface-hover text-text-dim hover:text-text-main transition-colors">
                <PaletteIcon className="w-5 h-5" />
            </button>
            <div className="absolute top-full right-0 mt-2 w-40 bg-surface border border-secondary rounded-lg shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                <p className="text-xs font-semibold text-text-dim px-2 pb-2 border-b border-secondary">Select Theme</p>
                <div className="mt-2 space-y-1">
                    {(Object.keys(themes) as ThemeName[]).map(themeName => (
                        <button
                            key={themeName}
                            onClick={() => setTheme(themeName)}
                            className={`w-full text-left text-sm px-2 py-1.5 rounded-md ${currentTheme === themeName ? 'bg-primary text-white font-semibold' : 'text-text-light hover:bg-surface-hover'}`}
                        >
                            {themeDisplayNames[themeName]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(ThemeSelector);