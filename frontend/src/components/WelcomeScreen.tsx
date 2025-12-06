import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

interface WelcomeScreenProps {
  onLogoClick: () => void;
}

export function WelcomeScreen({ onLogoClick }: WelcomeScreenProps) {
  const [imageError, setImageError] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>('/logo.png');

  useEffect(() => {
    // Try to load from public folder first, fallback to different paths
    const tryLoadImage = async () => {
      try {
        // In production build, check if image exists in public folder
        const img = new Image();
        img.src = '/logo.png';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        setLogoSrc('/logo.png');
      } catch {
        // Fallback: try relative path for Electron
        try {
          const img = new Image();
          img.src = '../public/logo.png';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
          setLogoSrc('../public/logo.png');
        } catch {
          console.warn('Logo image not found, using fallback icon');
          setImageError(true);
        }
      }
    };

    tryLoadImage();
  }, []);

  return (
    <div className="flex-1 h-full flex flex-col bg-white">
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={onLogoClick}
          className="cursor-pointer transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg p-4"
          aria-label="Click for information"
        >
          {!imageError ? (
            <img
              src={logoSrc}
              alt="PPOP Prompt Logo"
              className="object-contain animate-pulse-custom rounded-lg"
              style={{ width: '60px', height: '60px' }}
              onError={() => {
                console.warn('Logo image failed to load, using fallback icon');
                setImageError(true);
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-[60px] h-[60px] bg-primary/10 rounded-lg animate-pulse-custom">
              <Info className="w-8 h-8 text-primary" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

