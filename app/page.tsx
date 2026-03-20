import Link from "next/link";
export const dynamic = "force-dynamic";
import { supabase } from "../lib/supabase";
import type { Player } from "../types/player";
import type { Match } from "../types/match";
import type { Standing } from "../types/standing";

const modules = [
  {
    title: "Tabla",
    description: "Consulta la clasificación general, el podio y el rendimiento reciente.",
    href: "/tabla",
    color: "from-cyan-400 via-sky-400 to-blue-500",
  },
  {
    title: "Jugadores",
    description: "Revisa perfiles, fotografías, estadísticas y estilo de juego.",
    href: "/jugadores",
    color: "from-emerald-400 via-lime-400 to-green-500",
  },
  {
    title: "Enfrentamientos",
    description: "Controla los cruces disponibles y el avance entre rivales.",
    href: "/enfrentamientos",
    color: "from-yellow-300 via-amber-400 to-orange-500",
  },
  {
    title: "Partidos",
    description: "Explora todos los partidos registrados y sus resultados.",
    href: "/partidos",
    color: "from-orange-400 via-red-400 to-pink-500",
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
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-28">
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
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

  const standingsMap = new Map<number, Standing>();
  safePlayers.forEach((player) => {
    standingsMap.set(player.id, {
      player_id: player.id,
      player_name: player.name,
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
    });
  });

  safeMatches.forEach((match) => {
    const winner = standingsMap.get(match.winner_id);
    const loser = standingsMap.get(match.loser_id);

    if (winner) {
      winner.played += 1;
      winner.wins += 1;
      winner.points += match.winner_points;
    }

    if (loser) {
      loser.played += 1;
      loser.losses += 1;
      loser.points += match.loser_points;
    }
  });

  const standings = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return a.player_name.localeCompare(b.player_name);
  });

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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-10 pt-28">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              3° Edición · Dashboard oficial
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
              Locos x
              <span className="block bg-gradient-to-r from-orange-300 via-yellow-300 to-cyan-300 bg-clip-text text-transparent">
                el Tenis
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
              Centro principal de seguimiento de la escalerilla, con clasificación
              actual, últimos resultados y control general del avance de la competencia.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/tabla"
                className="rounded-2xl bg-gradient-to-r from-orange-400 via-yellow-400 to-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:scale-[1.02]"
              >
                Ir a la tabla
              </Link>

              <Link
                href="/partidos"
                className="rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Ver últimos partidos
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-white/75">Jugadores</p>
                <p className="mt-2 text-3xl font-black">{totalPlayers}</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-white/75">Partidos jugados</p>
                <p className="mt-2 text-3xl font-black">{totalMatches}</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-white/75">Partidos pendientes</p>
                <p className="mt-2 text-3xl font-black">{totalPendingMatches}</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-white/75">Avance</p>
                <p className="mt-2 text-3xl font-black">{completionPercentage}%</p>
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">
                    Líder actual
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    {topThree[0]?.player_name || "Sin datos"}
                  </h2>
                  <p className="mt-1 text-white/80">
                    {topThree[0]?.points ?? 0} puntos · {topThree[0]?.wins ?? 0} victorias
                  </p>
                </div>

                <Link
                  href="/jugadores"
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  Ver jugadores
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
            <div className="mb-5">
              <h2 className="text-2xl font-black">Módulos principales</h2>
              <p className="mt-1 text-white/80">
                Acceso rápido a las secciones de la plataforma.
              </p>
            </div>

            <div className="grid gap-4">
              {modules.map((module) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group rounded-2xl border border-white/10 bg-black/10 p-4 transition hover:bg-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${module.color} shadow-lg`}
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black">{module.title}</h3>
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

        <section className="mt-10 grid gap-8 xl:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Podio actual</h2>
                <p className="mt-1 text-white/80">
                  Mejores posicionados de la escalerilla.
                </p>
              </div>

              <Link
                href="/tabla"
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Ver tabla
              </Link>
            </div>

            <div className="grid gap-4">
              {topThree.map((player, index) => {
                const position = index + 1;
                const fullPlayer = playerMap.get(player.player_id);

                return (
                  <Link
                    key={player.player_id}
                    href={`/jugadores/${player.player_id}`}
                    className="group rounded-2xl border border-white/10 bg-black/10 p-4 transition hover:bg-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow">
                        {getPositionBadge(position)}
                      </div>

                      <div className="h-14 w-14 overflow-hidden rounded-full border border-white/20 bg-white/10">
                        {fullPlayer?.photo_url ? (
                          <img
                            src={fullPlayer.photo_url}
                            alt={player.player_name}
                            className="h-full w-full object-contain"
                          />
                        ) : null}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-black">{player.player_name}</h3>
                        <p className="text-sm text-white/75">
                          {player.points} pts · {player.wins} PG · {player.losses} PP
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

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Últimos partidos</h2>
                <p className="mt-1 text-white/80">
                  Actividad reciente registrada en la competencia.
                </p>
              </div>

              <Link
                href="/partidos"
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Ver todos
              </Link>
            </div>

            <div className="space-y-4">
              {recentMatches.length > 0 ? (
                recentMatches.map((match) => {
                  const winner = playerMap.get(match.winner_id);
                  const loser = playerMap.get(match.loser_id);

                  return (
                    <article
                      key={match.id}
                      className="rounded-2xl border border-white/10 bg-black/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-black">
                          {winner?.name ?? `Jugador ${match.winner_id}`} venció a{" "}
                          {loser?.name ?? `Jugador ${match.loser_id}`}
                        </h3>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/85">
                          {match.match_date}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 text-sm text-white/80 sm:grid-cols-3">
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
                <div className="rounded-2xl border border-white/10 bg-black/10 p-6 text-white/75">
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