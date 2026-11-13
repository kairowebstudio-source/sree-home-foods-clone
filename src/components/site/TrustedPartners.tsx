import { useState } from "react";
import meraheLogo from "@/assets/merahe-logo.jpg.asset.json";
import kamadhenuvuLogo from "@/assets/kamadhenuvu-logo.jpg.asset.json";
import velvetValleyLogo from "@/assets/velvet-valley-logo.jpg.asset.json";
import amruthLogo from "@/assets/amruth-logo.jpg.asset.json";
import kaloriesLogo from "@/assets/kalories-logo.jpg.asset.json";
import lalithaaLogo from "@/assets/lalithaa-logo.jpg.asset.json";

/**
 * Trusted partners strip.
 *
 * To use the real logo artwork, drop the image files into `public/media/partners/`
 * and set the `logo` field below to its public path, e.g.
 *   logo: "/media/partners/kamadhenuvu.png"
 * Any partner without a `logo` (or whose image fails to load) renders as a
 * styled wordmark tile instead.
 */
type Partner = {
  name: string;
  tagline?: string;
  logo?: string;
  /** extra classes for the wordmark tile (background / border tint) */
  tileClass?: string;
  /** classes for the brand wordmark text */
  nameClass?: string;
  /** classes for the tagline text */
  taglineClass?: string;
};

const partners: Partner[] = [
  {
    name: "Kamadhenuvu",
    tagline: "Milk Junnu Powder",
    logo: kamadhenuvuLogo.url,
    tileClass: "bg-white border-[#1f5136]/25",
    nameClass: "text-[#1f5136] tracking-[0.08em] uppercase",
    taglineClass: "text-[#d43a35] font-semibold tracking-[0.22em] uppercase",
  },
  {
    name: "Merāhe",
    logo: meraheLogo.url,
    tileClass: "bg-white border-neutral-300",
    nameClass: "text-neutral-900 tracking-[0.14em]",
  },
  {
    name: "Nand Gokul",
    tagline: "Pure Ghee",
    tileClass: "bg-white border-[#1f4e9c]/25",
    nameClass: "text-[#1f4e9c] tracking-[0.06em]",
    taglineClass: "text-[#c8a24a] font-script text-lg leading-none",
  },
  {
    name: "Velvet Valley",
    tagline: "Inspired by Nature",
    logo: velvetValleyLogo.url,
    tileClass: "bg-white border-[#2b5fb0]/25",
    nameClass: "text-[#1f4e9c] tracking-[0.03em] italic",
    taglineClass: "text-[#8e4f9e] tracking-[0.2em] uppercase",
  },
  {
    name: "Amruth",
    logo: amruthLogo.url,
    tileClass: "bg-[#d81f26] border-[#f0b429] border-2",
    nameClass: "text-white italic tracking-[0.02em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]",
  },
  {
    name: "kalories",
    tagline: "Chocolates",
    logo: kaloriesLogo.url,
    tileClass: "bg-[#141210] border-[#b98a45]/50",
    nameClass: "text-[#d9ab63] font-normal tracking-[0.02em]",
    taglineClass: "text-[#b98a45]/80 tracking-[0.24em] uppercase",
  },
  {
    name: "Beyond Flavour",
    tagline: "Rooted in Nature",
    tileClass: "bg-[#f7efcd] border-[#5d7a26]/30",
    nameClass: "text-[#4a6420] tracking-[0.02em]",
    taglineClass: "text-[#5d7a26]/85 normal-case tracking-normal",
  },
  {
    name: "Lalithaa",
    tagline: "Agarbatti",
    logo: lalithaaLogo.url,
    tileClass: "bg-white border-neutral-300",
    nameClass: "text-black tracking-[0.06em]",
    taglineClass: "text-neutral-600 tracking-[0.3em] uppercase",
  },
];

function PartnerTile({ partner: p }: { partner: Partner }) {
  const [broken, setBroken] = useState(false);
  const showLogo = Boolean(p.logo) && !broken;

  return (
    <div className="flex w-36 shrink-0 flex-col items-center gap-2 sm:w-44" title={p.name}>
      <div
        className={`flex h-24 w-36 items-center justify-center overflow-hidden rounded-xl border px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:h-28 sm:w-44 ${
          p.tileClass ?? "bg-white border-border"
        }`}
      >
      {showLogo ? (
        <img
          src={p.logo}
          alt={p.name}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 text-center">
          <span
            className={`font-display text-sm leading-tight sm:text-lg ${p.nameClass ?? "text-brand"}`}
          >
            {p.name}
          </span>
          {p.tagline && (
            <span
              className={`text-[8px] leading-tight sm:text-[9px] ${p.taglineClass ?? "text-muted-foreground"}`}
            >
              {p.tagline}
            </span>
          )}
        </div>
      )}
      </div>
      <span className="max-w-full truncate text-center text-xs font-medium text-foreground/70 sm:text-sm">
        {p.name}
      </span>
    </div>
  );
}

export function TrustedPartners() {
  return (
    <section className="relative border-t border-gold/20 bg-cream py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className="text-gold text-xs tracking-[0.3em] font-bold uppercase">
            Our network
          </span>
          <h2 className="mt-2 font-display text-3xl md:text-4xl text-brand">Trusted Partners</h2>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gold" />
            <i className="fas fa-handshake text-leaf" />
            <span className="h-px w-12 bg-gold" />
          </div>
          <p className="mx-auto mt-4 max-w-xl text-sm text-foreground/70 md:text-base">
            Brands we stock, distribute and grow with — across Andhra Pradesh and Telangana.
          </p>
        </div>
      </div>

      <div
        className="group relative mt-10 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="marquee-track flex w-max group-hover:[animation-play-state:paused]">
          {[0, 1].map((half) => (
            <div
              key={half}
              className="flex shrink-0 items-center gap-4 pr-4 sm:gap-6 sm:pr-6"
              aria-hidden={half === 1}
            >
              {partners.map((p) => (
                <PartnerTile key={`${half}-${p.name}`} partner={p} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
