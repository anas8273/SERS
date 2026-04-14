export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 gap-5">
      {/* Animated Logo with shimmer */}
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30">
          <span className="text-white text-3xl font-black">S</span>
        </div>
        {/* Ping ring */}
        <div className="absolute inset-0 bg-violet-400/20 rounded-2xl animate-ping" />
        {/* Shimmer sweep */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="w-full h-full animate-shimmer" />
        </div>
      </div>

      {/* Brand text */}
      <span className="text-sm font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">
        SERS
      </span>

      {/* Loading dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-violet-500/60"
            style={{
              animation: 'bounce 1s infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
