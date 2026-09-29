export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";

type ChampionPlace = {
  position: 1 | 2 | 3;
  name: string;
  label: string;
  image: string;
  imageClassName?: string;
};

type EditionPodium = {
  edition: string;
  subtitle: string;
  champion: ChampionPlace;
  second: ChampionPlace;
  third: ChampionPlace;
};

const editions: EditionPodium[] = [
  {
    edition: "1° edición",
    subtitle: "Primer campeonato oficial de la escalerilla",
    champion: {
      position: 1,
      name: "Alexis Navarro",
      label: "Campeón",
      image: "/jugadores/alexis.png",
    },
    second: {
      position: 2,
      name: "Hector Moreno",
      label: "Segundo lugar",
      image: "/jugadores/hector.png",
    },
    third: {
      position: 3,
      name: "Mariano Muñoz",
      label: "Tercer lugar",
      image: "/jugadores/mariano.png",
      imageClassName: "hrelative h-[122%] w-[122%] max-w-none object-cover object-[58%_18%]",
    },
  },
  {
    edition: "2° edición",
    subtitle: "Consolidación competitiva del grupo",
    champion: {
      position: 1,
      name: "Hector Moreno",
      label: "Campeón",
      image: "/jugadores/hector.png",
    },
    second: {
      position: 2,
      name: "Alvaro Bastias",
      label: "Segundo lugar",
      image: "/jugadores/alvaro.png",
    },
    third: {
      position: 3,
      name: "Mariano Muñoz",
      label: "Tercer lugar",
      image: "/jugadores/mariano.png",
      imageClassName: "relative h-[122%] w-[122%] max-w-none object-cover object-[58%_18%]",
    },
  },
  {
    edition: "3° edición",
    subtitle: "Edición histórica antes del nuevo formato",
    champion: {
      position: 1,
      name: "Hector Moreno",
      label: "Campeón",
      image: "/jugadores/hector.png",
    },
    second: {
      position: 2,
      name: "Didier Mehsen",
      label: "Segundo lugar",
      image: "/jugadores/didier.png",
    },
    third: {
      position: 3,
      name: "Alexis Navarro",
      label: "Tercer lugar",
      image: "/jugadores/alexis.png",
    },
  },
];

function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M37 16h46v18c0 20.4-9.3 34.5-23 38.8C46.3 68.5 37 54.4 37 34V16Z"
        fill="currentColor"
      />
      <path
        d="M30 23H15v8c0 16.4 8.6 28.7 24.2 32.4"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M90 23h15v8c0 16.4-8.6 28.7-24.2 32.4"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M60 73v17"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M42 96h36"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M33 106h54"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getMedal(position: 1 | 2 | 3) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  return "🥉";
}

function getPositionClass(position: 1 | 2 | 3) {
  if (position === 1) {
    return {
      card: "border-yellow-300 bg-gradient-to-b from-yellow-50 via-white to-amber-50 shadow-[0_24px_70px_rgba(234,179,8,0.28)]",
      badge: "bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-slate-950 shadow-[0_10px_28px_rgba(234,179,8,0.35)]",
      image: "h-36 w-36 sm:h-44 sm:w-44",
      title: "text-3xl sm:text-4xl",
      glow: true,
      trophy: "text-yellow-300/18",
    };
  }

  if (position === 2) {
    return {
      card: "border-slate-300 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_16px_48px_rgba(15,23,42,0.12)]",
      badge: "bg-slate-900 text-white shadow-[0_10px_26px_rgba(15,23,42,0.22)]",
      image: "h-28 w-28 sm:h-34 sm:w-34",
      title: "text-2xl sm:text-3xl",
      glow: false,
      trophy: "text-slate-300/22",
    };
  }

  return {
    card: "border-orange-300 bg-gradient-to-b from-orange-50 via-white to-amber-50 shadow-[0_16px_48px_rgba(234,88,12,0.14)]",
    badge: "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_10px_26px_rgba(234,88,12,0.24)]",
    image: "h-28 w-28 sm:h-34 sm:w-34",
    title: "text-2xl sm:text-3xl",
    glow: false,
    trophy: "text-orange-300/20",
  };
}

function PodiumCard({ player }: { player: ChampionPlace }) {
  const style = getPositionClass(player.position);

  return (
    <article
      className={`group relative min-h-full overflow-hidden rounded-[2.1rem] border p-5 text-center transition duration-300 hover:-translate-y-1 ${style.card}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300" />

      {style.glow && (
        <>
          <div className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-yellow-300/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.24),transparent_44%)]" />
          <div className="absolute left-6 top-7 h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_22px_rgba(250,204,21,0.9)]" />
          <div className="absolute right-8 top-16 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
          <div className="absolute bottom-14 left-10 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
        </>
      )}

      <TrophyIcon
        className={`pointer-events-none absolute -right-8 top-8 h-36 w-36 rotate-12 ${style.trophy}`}
      />

      <div className="relative mx-auto flex w-fit flex-col items-center">
        <span
          className={`mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${style.badge}`}
        >
          {getMedal(player.position)} {player.label}
        </span>

        <div
          className={`relative flex items-center justify-center overflow-hidden rounded-[2rem] border border-white/90 bg-white shadow-xl ring-1 ring-black/5 ${style.image}`}
        >
          {style.glow && (
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-yellow-200/20 via-transparent to-cyan-200/20" />
          )}

          <img
            src={player.image}
            alt={player.name}
            className={
              player.imageClassName ??
              "relative h-full w-full object-contain object-center p-1"
            }
          />
        </div>

        <h3
          className={`mt-5 font-black leading-tight tracking-tight text-slate-950 ${style.title}`}
        >
          {player.name}
        </h3>

        <p className="mt-2 text-sm font-bold text-slate-500">
          {player.position}° lugar
        </p>
      </div>
    </article>
  );
}

export default function CampeonesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_30%,#f8fafc_100%)] text-slate-900">
      <div className="mobile-safe-x mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_28px_90px_rgba(15,23,42,0.32)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.30),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.24),transparent_28%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/92 to-emerald-950/84" />

          <TrophyIcon className="pointer-events-none absolute -right-12 top-8 h-72 w-72 rotate-12 text-yellow-300/10 sm:h-96 sm:w-96 lg:right-10 lg:top-2 lg:h-[30rem] lg:w-[30rem]" />

          <div className="absolute left-8 top-8 h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.9)]" />
          <div className="absolute bottom-12 right-20 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.9)]" />
          <div className="absolute bottom-20 left-1/2 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.9)]" />

          <div className="relative max-w-4xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 backdrop-blur">
              Salón de campeones
            </span>

            <h1 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Campeones de
              <span className="block bg-gradient-to-r from-yellow-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                ediciones anteriores
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-white/82 sm:text-lg">
              Reconocimiento a quienes marcaron la historia de la escalerilla. Cada
              edición deja nuevos desafíos, rivalidades y referentes para quienes buscan
              llegar al podio.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/tabla"
                className="rounded-2xl bg-gradient-to-r from-yellow-300 via-cyan-300 to-emerald-300 px-6 py-3 text-center text-sm font-black text-slate-950 shadow-xl transition hover:scale-[1.02]"
              >
                Ver tabla actual
              </Link>

              <Link
                href="/jugadores"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-center text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                Ver jugadores
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8">
          {editions.map((edition) => (
            <article
              key={edition.edition}
              className="overflow-hidden rounded-[2.4rem] border border-slate-200 bg-white shadow-[0_20px_65px_rgba(15,23,42,0.09)]"
            >
              <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-white via-cyan-50 to-yellow-50 p-6">
                <TrophyIcon className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rotate-12 text-yellow-300/18" />

                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
                      Historial oficial
                    </p>

                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      {edition.edition}
                    </h2>

                    <p className="mt-2 text-sm text-slate-600 sm:text-base">
                      {edition.subtitle}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg">
                    Podio histórico
                  </span>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.2fr_0.9fr] lg:items-end">
                <div className="order-2 lg:order-1">
                  <PodiumCard player={edition.second} />
                </div>

                <div className="order-1 lg:order-2">
                  <PodiumCard player={edition.champion} />
                </div>

                <div className="order-3">
                  <PodiumCard player={edition.third} />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-[2.4rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.26)] sm:p-8 lg:p-10">
          <div className="relative">
            <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-yellow-300/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-cyan-300/15 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                  La historia continúa
                </p>

                <h2 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">
                  ¿Quién será el próximo campeón?
                </h2>

                <p className="mt-4 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
                  La 4° edición ya está en marcha. Cada partido suma, cada punto pesa y
                  cada jugador tiene la oportunidad de escribir su nombre en esta galería.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 via-cyan-300 to-emerald-300 text-3xl shadow-xl">
                    🏆
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white/70">Meta actual</p>
                    <p className="mt-1 text-2xl font-black">
                      Entrar al podio histórico
                    </p>
                  </div>
                </div>

                <Link
                  href="/tabla"
                  className="mt-5 inline-flex w-full justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-50"
                >
                  Revisar clasificación actual
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}