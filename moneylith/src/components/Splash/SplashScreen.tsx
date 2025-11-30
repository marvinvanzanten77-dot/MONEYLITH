interface SplashScreenProps {
  onEnter: () => void;
}

export function SplashScreen({ onEnter }: SplashScreenProps) {
  return (
    <div className="moneylith-splash">
      <div className="moneylith-splash-card">
        <img
          src="/logo/logo%20moneylith.png"
          alt="Logo Moneylith"
          className="moneylith-splash-logo"
        />
        <p className="moneylith-splash-text">Je persoonlijke financiële command-center</p>
        <button className="moneylith-splash-action" onClick={onEnter}>
          Enter Moneylith
        </button>
        <p className="moneylith-splash-subtext">Lokaal, veilig en volledig offline.</p>
      </div>
    </div>
  );
}
