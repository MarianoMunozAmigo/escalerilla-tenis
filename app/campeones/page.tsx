export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";

type ChampionPlace = {
  position: 1 | 2 | 3;
  name: string;
  label: string;
  image: string;
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

function getMedal(position: 1 | 2 | 3) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  return "🥉";
}

function getPositionClass(position: 1 | 2 | 3) {
  if (position === 1) {
    return {
      card: "border-yellow-300 bg-gradient-to-b from-yellow-50 via-white to-amber-50 shadow-[0_18px_55px_rgba(234,179,8,0.20)]",
      badge: "bg-yellow-400 text-slate-950",
      image: "h-32 w-32 sm:h-40 sm:w-40",
      title: "text-2xl sm:text-3xl",
    };
  }

  if (position === 2) {
    return {
      card: "border-slate-300 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_14px_45px_rgba(15,23,42,0.10)]",
      badge: "bg-slate-800 text-white",
      image: "h-24 w-24 sm:h-32 sm:w-32",
      title: "text-xl sm:text-2xl",
    };
  }

  return {
    card: "border-orange-300 bg-gradient-to-b from-orange-50 via-white to-amber-50 shadow-[0_14px_45px_rgba(234,88,12,0.12)]",
    badge: "bg-orange-500 text-white",
    image: "h-24 w-24 sm:h-32 sm:w-32",
    title: "text-xl sm:text-2xl",
  };
}

function PodiumCard({ player }: { player: ChampionPlace }) {
  const style = getPositionClass(player.position);

  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] border p-5 text-center ${style.card}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300" />

      <div className="mx-auto flex w-fit flex-col items-center">
        <span
          className={`mb-4 inline-flex rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] shadow-sm ${style.badge}`}
        >
          {getMedal(player.position)} {player.label}
        </span>

        <div
          className={`flex items-center justify-center overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-xl ${style.image}`}
        >
          <img
            src={player.image}
            alt={player.name}
            className="h-full w-full object-contain p-1"
          />
        </div>

        <h3 className={`mt-5 font-black tracking-tight text-slate-950 ${style.title}`}>
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
        <section className="relative overflow-hidden rounded-[2.2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.25)] sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.26),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.20),transparent_26%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-emerald-950/80" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 backdrop-blur">
              Salón de campeones
            </span>

            <h1 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
              Campeones de
              <span className="block bg-gradient-to-r from-yellow-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                ediciones anteriores
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-white/82 sm:text-lg">
              Reconocimiento a los jugadores que marcaron la historia de la escalerilla.
              Cada edición deja nuevos desafíos, rivalidades y referentes para quienes
              buscan llegar al podio.
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
              className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]"
            >
              <div className="border-b border-slate-100 bg-gradient-to-r from-white via-cyan-50 to-yellow-50 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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

                  <span className="w-fit rounded-full bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
                    Podio histórico
                  </span>
                </div>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-[0.9fr_1.2fr_0.9fr] lg:items-end sm:p-6">
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
      </div>
    </main>
  );
}