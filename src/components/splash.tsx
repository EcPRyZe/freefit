export function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg text-fg">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary">
        <span className="font-display text-3xl font-bold tracking-tight text-primary-fg">F</span>
      </div>
      <p className="mt-5 font-display text-4xl font-semibold tracking-wide">FREEFIT</p>
      <p className="mt-1 text-sm text-muted">Personalized strength training</p>
    </div>
  );
}
