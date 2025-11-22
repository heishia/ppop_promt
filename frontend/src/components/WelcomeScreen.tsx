interface WelcomeScreenProps {
  onLogoClick: () => void;
}

export function WelcomeScreen({ onLogoClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 h-full flex flex-col bg-white">
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={onLogoClick}
          className="cursor-pointer transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg p-4"
          aria-label="정보 페이지로 이동"
        >
          <img
            src="/logo.png"
            alt="PPOP Prompt Logo"
            className="object-contain animate-pulse-custom rounded-lg"
            style={{ width: '60px', height: '60px' }}
          />
        </button>
      </div>
    </div>
  );
}

