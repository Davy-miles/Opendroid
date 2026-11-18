import React, { useEffect, useState } from 'react';

interface AppIconProps {
  name?: string;
  src?: string;
  zoom?: boolean;
  fallbackSrc?: string;
  fallbackZoom?: boolean;
  monogram: string;
  accentColor: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  src,
  zoom = false,
  fallbackSrc,
  fallbackZoom = false,
  monogram,
  accentColor,
  size = 'md',
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setUseFallback(false);
    setImgFailed(false);
  }, [src, fallbackSrc]);

  const activeSrc = !useFallback ? src : fallbackSrc;
  const activeZoom = !useFallback ? zoom : fallbackZoom;

  const dimensions =
    size === 'xl'
      ? 'w-[72px] h-[72px] rounded-[20px] text-xl'
      : size === 'lg'
        ? 'w-16 h-16 rounded-[18px] text-lg'
        : size === 'sm'
          ? 'w-11 h-11 rounded-[13px] text-xs'
          : 'w-14 h-14 rounded-[16px] text-sm';

  if (activeSrc && !imgFailed) {
    return (
      <div
        className={`${dimensions} shrink-0 overflow-hidden bg-[#0E0B1A] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_24px_-8px_rgba(0,0,0,0.8)] select-none`}
      >
        <img
          src={activeSrc}
          alt={name ? `Ícone do aplicativo ${name}` : ''}
          referrerPolicy="no-referrer"
          onError={() => {
            if (!useFallback && fallbackSrc && fallbackSrc !== src) {
              setUseFallback(true);
            } else {
              setImgFailed(true);
            }
          }}
          className={`w-full h-full object-cover ${activeZoom ? 'scale-[1.33]' : ''}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dimensions} shrink-0 flex items-center justify-center font-display font-bold tracking-tight text-white select-none border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_10px_24px_-8px_rgba(0,0,0,0.75)]`}
      style={{
        backgroundColor: accentColor,
        backgroundImage:
          'linear-gradient(145deg, rgba(255,255,255,0.24) 0%, rgba(15,10,30,0.38) 100%)',
      }}
      aria-hidden="true"
    >
      {monogram}
    </div>
  );
};
