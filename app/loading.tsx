import "./globals.css";

export default function RootLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-noise">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="splash-bloom" />
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-ink-900/10 border-t-ink-900" />
          <div className="absolute inset-2 rounded-2xl bg-white/80 shadow-card" />
        </div>
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-700">Swiple</div>
        <div className="text-xs text-ink-700">Loading your deck...</div>
      </div>
    </main>
  );
}
