export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { supabase } from "../lib/supabase";
import { buildStandings } from "../lib/standings";
import type { Player } from "../types/player";
import type { Match } from "../types/match";

const modules = [
  {
    title: "Tabla",
    description: "Consulta la clasificación general, el podio y el rendimiento reciente.",
    href: "/tabla",
    color: "from-cyan-400 via-sky-400 to-blue-500",
    icon: "🏆",
  },
  {
    title: "Jugadores",
    description: "Revisa perfiles, fotografías, estadísticas y estilo de juego.",
    href: "/jugadores",
    color: "from-emerald-400 via-lime-400 to-green-500",
    icon: "🎾",
  },
  {
    title: "Enfrentamientos",
    description: "Controla los cruces disponibles y el avance entre rivales.",
    href: "/enfrentamientos",
    color: "from-yellow-300 via-amber-400 to-orange-500",
    icon: "🤝",
  },
  {
    title: "Partidos",
    description: "Explora todos los partidos registrados y sus resultados.",
    href: "/partidos",
    color: "from-orange-400 via-red-400 to-pink-500",
    icon: "📋",
  },
];

function getPairKey(playerA: number, playerB: number) {
  const min = Math.min(playerA, playerB);
  const max = Math.max(playerA, playerB);
  return `${min}-${max}`;
}

function getPositionBadge(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
}

function getTopPill(position: number) {
  if (position === 1) return "bg-yellow-400 text-slate-900";
  if (position === 2) return "bg-slate-800 text-white";
  if (position === 3) return "bg-amber-500 text-white";
  return "bg-slate-900 text-white";
}

export default async function Home() {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true });

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false })
    .order("id", { ascending: false });

  if (playersError || matchesError) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mobile-safe-x mx-auto max-w-6xl px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-100 sm:p-6">
            Error al cargar el dashboard: {playersError?.message || matchesError?.message}
          </div>
        </div>
      </main>
    );
  }

  const safePlayers: Player[] = players ?? [];
  const safeMatches: Match[] = matches ?? [];

  const playerMap = new Map<number, Player>();
  safePlayers.forEach((player) => {
    playerMap.set(player.id, player);
  });

  const standings = buildStandings(safePlayers, safeMatches);
  const topThree = standings.slice(0, 3);

  const totalPlayers = safePlayers.length;
  const totalMatches = safeMatches.length;

  const maxPossibleMatches = (totalPlayers * (totalPlayers - 1)) / 2 * 2;
  const completionPercentage =
    maxPossibleMatches > 0
      ? Math.round((totalMatches / maxPossibleMatches) * 100)
      : 0;

  const pairCountMap = new Map<string, number>();
  safeMatches.forEach((match) => {
    const key = getPairKey(match.player_1_id, match.player_2_id);
    pairCountMap.set(key, (pairCountMap.get(key) ?? 0) + 1);
  });

  let totalPendingMatches = 0;
  for (let i = 0; i < safePlayers.length; i++) {
    for (let j = i + 1; j < safePlayers.length; j++) {
      const key = getPairKey(safePlayers[i].id, safePlayers[j].id);
      const played = pairCountMap.get(key) ?? 0;
      totalPendingMatches += Math.max(0, 2 - played);
    }
  }

  const recentMatches = safeMatches.slice(0, 5);
  const leader = topThree[0] ? playerMap.get(topThree[0].player_id) : null;

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/dashboard/fondo-escalerilla.jpg')",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/80 via-emerald-950/65 to-orange-950/80" />
      <div className="absolute inset-0 bg-black/25" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28">
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
          <div>
            <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] backdrop-blur sm:text-sm">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              3° edición · dashboard oficial
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-7xl">
              Locos x
              <span className="block bg-gradient-to-r from-orange-300 via-yellow-300 to-cyan-300 bg-clip-text text-transparent">
                el Tenis
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8 md:text-xl">
              Centro principal de seguimiento de la escalerilla, con clasificación
              actual, perfiles de jugadores, actividad reciente y control del avance
              de la competencia.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/tabla"
                className="rounded-2xl bg-gradient-to-r from-orange-400 via-yellow-400 to-cyan-400 px-6 py-3 text-center text-sm font-black text-slate-950 shadow-xl transition hover:scale-[1.02]"
              >
                Ir a la tabla
              </Link>

              <Link
                href="/jugadores"
                className="rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-center text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Ver jugadores
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.6rem] border border-white/15 bg-white/10 p-4 backdrop-blur sm:p-5">
                <p className="text-sm text-white/75">Jugadores</p>
                <p className="mt-2 text-2xl font-black sm:text-3xl">{totalPlayers}</p>
              </div>

              <div className="rounded-[1.6rem] border border-white/15 bg-white/10 p-4 backdrop-blur sm:p-5">
                <p className="text-sm text-white/75">Partidos jugados</p>
                <p className="mt-2 text-2xl font-black sm:text-3xl">{totalMatches}</p>
              </div>

              <div className="rounded-[1.6rem] border border-white/15 bg-white/10 p-4 backdrop-blur sm:p-5">
                <p className="text-sm text-white/75">Pendientes</p>
                <p className="mt-2 text-2xl font-black sm:text-3xl">{totalPendingMatches}</p>
              </div>

              <div className="rounded-[1.6rem] border border-white/15 bg-white/10 p-4 backdrop-blur sm:p-5">
                <p className="text-sm text-white/75">Avance</p>
                <p className="mt-2 text-2xl font-black sm:text-3xl">{completionPercentage}%</p>
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70 sm:text-sm">
                    Líder actual
                  </p>
                  <h2 className="mt-2 truncate text-2xl font-black sm:text-3xl">
                    {topThree[0]?.player_name || "Sin datos"}
                  </h2>
                  <p className="mt-1 text-sm text-white/80 sm:text-base">
                    {topThree[0]?.points ?? 0} puntos · {topThree[0]?.wins ?? 0} victorias
                  </p>
                </div>

                {leader?.photo_url && (
                  <div className="hidden h-20 w-20 overflow-hidden rounded-3xl border border-white/20 bg-white/10 sm:flex">
                    <img
                      src={leader.photo_url}
                      alt={leader.name}
                      className="h-full w-full object-cover object-[center_20%]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md sm:p-5">
            <div className="mb-5">
              <h2 className="text-xl font-black sm:text-2xl">Módulos principales</h2>
              <p className="mt-1 text-sm text-white/80 sm:text-base">
                Acceso rápido a las secciones de la plataforma.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4">
              {modules.map((module) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group rounded-[1.6rem] border border-white/10 bg-black/10 p-4 transition hover:bg-white/10"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${module.color} text-xl shadow-lg`}
                    >
                      {module.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-black sm:text-lg">{module.title}</h3>
                        <span className="text-sm font-semibold text-white/70 transition group-hover:translate-x-1">
                          →
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-white/75">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.1fr] xl:gap-8">
          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black sm:text-2xl">Podio actual</h2>
                <p className="mt-1 text-sm text-white/80 sm:text-base">
                  Mejores posicionados de la escalerilla.
                </p>
              </div>

              <Link
                href="/tabla"
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-white/20"
              >
                Ver tabla
              </Link>
            </div>

            <div className="grid gap-3 sm:gap-4">
              {topThree.map((player, index) => {
                const position = index + 1;
                const fullPlayer = playerMap.get(player.player_id);

                return (
                  <Link
                    key={player.player_id}
                    href={`/jugadores/${player.player_id}`}
                    className="group rounded-[1.6rem] border border-white/10 bg-black/10 p-4 transition hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow sm:h-14 sm:w-14 sm:text-2xl ${getTopPill(
                          position
                        )}`}
                      >
                        {getPositionBadge(position)}
                      </div>

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 sm:h-14 sm:w-14">
                        {fullPlayer?.photo_url ? (
                          <img
                            src={fullPlayer.photo_url}
                            alt={player.player_name}
                            className="h-full w-full object-cover object-[center_20%]"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-black">{player.player_name}</h3>
                        <p className="text-sm text-white/75">
                          {player.points} pts · {player.wins} PG · DG{" "}
                          {player.game_difference > 0
                            ? `+${player.game_difference}`
                            : player.game_difference}
                        </p>
                      </div>

                      <span className="text-white/60 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black sm:text-2xl">Últimos partidos</h2>
                <p className="mt-1 text-sm text-white/80 sm:text-base">
                  Actividad reciente registrada en la competencia.
                </p>
              </div>

              <Link
                href="/partidos"
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-white/20"
              >
                Ver todos
              </Link>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {recentMatches.length > 0 ? (
                recentMatches.map((match) => {
                  const winner = playerMap.get(match.winner_id);
                  const loser = playerMap.get(match.loser_id);

                  return (
                    <article
                      key={match.id}
                      className="rounded-[1.6rem] border border-white/10 bg-black/10 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <h3 className="text-sm font-black sm:text-base">
                          {winner?.name ?? `Jugador ${match.winner_id}`} venció a{" "}
                          {loser?.name ?? `Jugador ${match.loser_id}`}
                        </h3>

                        <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/85">
                          {match.match_date}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-white/80 sm:grid-cols-3 sm:gap-3">
                        <p>Marcador: {match.score_text}</p>
                        <p>Super tie break: {match.super_tiebreak ? "Sí" : "No"}</p>
                        <p>
                          Puntos: {match.winner_points} - {match.loser_points}
                        </p>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[1.6rem] border border-white/10 bg-black/10 p-6 text-white/75">
                  Aún no hay partidos registrados.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}