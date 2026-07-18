export function Marquee({ items }: { items: string[] }) {
  return (
    <div className="bg-gold/95 text-brand overflow-hidden py-3 border-y-2 border-brand/20">
      <div className="flex whitespace-nowrap marquee-track">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex shrink-0 gap-12 px-6">
            {items.map((t, idx) => (
              <span key={idx} className="text-sm md:text-base font-display font-bold tracking-widest uppercase flex items-center gap-3">
                ✦ {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
