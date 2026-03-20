import Link from "next/link";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
import { supabase } from "../../../lib/supabase";
import type { Player } from "../../../types/player";
import type { Match } from "../../../types/match";
import type { Standing } from "../../../types/standing";

type PlayerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RivalSummary = {
  rival_id: number;
  rival_name: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
};

export default async function PlayerDetailPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const playerId = Number(id);

  if (!playerId || Number.isNaN(playerId)) {
    notFound();
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (playerError || !player) {
    notFound();
  }

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true });

  const { data: allMatches } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false })
    .order("id", { ascending: false });

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .or(`player_1_id.eq.${playerId},player_2_id.eq.${playerId}`)
    .order("match_date", { ascending: false })
    .order("id", { ascending: false });

  const safePlayer: Player = player;
  const safePlayers: Player[] = players ?? [];
  const safeAllMatches: Match[] = allMatches ?? [];
  const safeMatches: Match[] = matches ?? [];

  const playerMap = new Map<number, string>();
  safePlayers.forEach((item) => {
    playerMap.set(item.id, item.name);
  });

  let wins = 0;
  let losses = 0;
  let points = 0;

  safeMatches.forEach((match) => {
    if (match.winner_id === playerId) {
      wins += 1;
      points += match.winner_points;
    }

    if (match.loser_id === playerId) {
      losses += 1;
      points += match.loser_points;
    }
  });

  const played = wins + losses;

  const standingsMap = new Map<number, Standing>();

  safePlayers.forEach((item) => {
    standingsMap.set(item.id, {
      player_id: item.id,
      player_name: item.name,
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
    });
  });

  safeAllMatches.forEach((match) => {
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

  const currentPosition =
    standings.findIndex((row) => row.player_id === playerId) + 1;

  const rivalSummaryMap = new Map<number, RivalSummary>();

  safeMatches.forEach((match) => {
    const rivalId =
      match.player_1_id === playerId ? match.player_2_id : match.player_1_id;

    const rivalName = playerMap.get(rivalId) ?? `Jugador ${rivalId}`;

    if (!rivalSummaryMap.has(rivalId)) {
      rivalSummaryMap.set(rivalId, {
        rival_id: rivalId,
        rival_name: rivalName,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
      });
    }

    const summary = rivalSummaryMap.get(rivalId)!;
    summary.played += 1;

    if (match.winner_id === playerId) {
      summary.wins += 1;
      summary.points += match.winner_points;
    } else {
      summary.losses += 1;
      summary.points += match.loser_points;
    }
  });

  const rivalSummaries = Array.from(rivalSummaryMap.values()).sort((a, b) => {
    if (b.played !== a.played) return b.played - a.played;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.rival_name.localeCompare(b.rival_name);
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <Link
            href="/jugadores"
            className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            ← Volver a jugadores
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/60 via-emerald-100/40 to-orange-100/60" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -bottom-12 left-0 h-40 w-40 rounded-full bg-orange-300/20 blur-3xl" />

          <div className="relative grid lg:grid-cols-[380px_1fr]">
            <div className="flex items-center justify-center bg-gradient-to-b from-cyan-50 via-white to-orange-50 p-6">
              {safePlayer.photo_url ? (
                <img
                  src={safePlayer.photo_url}
                  alt={safePlayer.name}
                  className="max-h-[500px] w-full rounded-[2rem] object-contain"
                />
              ) : (
                <div className="flex h-[420px] w-full items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500">
                  Sin fotografía
                </div>
              )}
            </div>

            <div className="relative p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
                  {safePlayer.handedness || "Mano no registrada"}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    safePlayer.active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {safePlayer.active ? "Activo" : "Inactivo"}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                {safePlayer.name}
              </h1>

              <p className="mt-3 max-w-2xl text-slate-600">
                {safePlayer.short_description || "Sin descripción breve registrada."}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Posición actual</p>
                  <p className="mt-2 text-3xl font-black">{currentPosition || "-"}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Partidos jugados</p>
                  <p className="mt-2 text-3xl font-black">{played}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Victorias</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{wins}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Derrotas</p>
                  <p className="mt-2 text-3xl font-black text-orange-600">{losses}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Puntos</p>
                  <p className="mt-2 text-3xl font-black text-cyan-700">{points}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Descripción
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {safePlayer.short_description || "Sin descripción breve registrada."}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Estilo de juego
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {safePlayer.play_style || "Sin estilo de juego registrado."}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Fortalezas
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {safePlayer.strengths || "Sin fortalezas registradas."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-black">Resumen por rival</h2>
            <p className="mt-1 text-slate-600">
              Balance de partidos y puntos obtenidos frente a cada adversario.
            </p>
          </div>

          {rivalSummaries.length === 0 ? (
            <p className="text-slate-600">
              Este jugador aún no registra enfrentamientos.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Rival</th>
                    <th className="px-4 py-3 text-center">PJ</th>
                    <th className="px-4 py-3 text-center">PG</th>
                    <th className="px-4 py-3 text-center">PP</th>
                    <th className="px-4 py-3 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rivalSummaries.map((summary) => (
                    <tr key={summary.rival_id} className="border-t border-slate-200">
                      <td className="px-4 py-3">
                        <Link
                          href={`/jugadores/${summary.rival_id}`}
                          className="font-bold text-slate-900 hover:underline"
                        >
                          {summary.rival_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">{summary.played}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">
                        {summary.wins}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-orange-700">
                        {summary.losses}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-cyan-700">
                        {summary.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-black">Historial de partidos</h2>
            <p className="mt-1 text-slate-600">
              Todos los resultados registrados del jugador en la escalerilla.
            </p>
          </div>

          {matchesError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              Error al cargar partidos: {matchesError.message}
            </p>
          )}

          {!matchesError && safeMatches.length === 0 && (
            <p className="text-slate-600">
              Este jugador aún no registra partidos.
            </p>
          )}

          {!matchesError && safeMatches.length > 0 && (
            <div className="space-y-4">
              {safeMatches.map((match) => {
                const opponentId =
                  match.player_1_id === playerId ? match.player_2_id : match.player_1_id;

                const opponentName =
                  playerMap.get(opponentId) ?? `Jugador ${opponentId}`;

                const isWinner = match.winner_id === playerId;

                return (
                  <article
                    key={match.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black">
                          {isWinner ? "Victoria" : "Derrota"} ante {opponentName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Fecha del partido: {match.match_date}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          isWinner
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {isWinner ? "Ganado" : "Perdido"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Marcador
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">{match.score_text}</p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Super tie break
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {match.super_tiebreak ? "Sí" : "No"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Rival
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">{opponentName}</p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Puntos obtenidos
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {isWinner ? match.winner_points : match.loser_points}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}