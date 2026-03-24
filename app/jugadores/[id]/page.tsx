export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { buildStandings } from "../../../lib/standings";
import type { Player } from "../../../types/player";
import type { Match } from "../../../types/match";

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

function parseStrengths(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getResultStyles(isWinner: boolean) {
  return isWinner
    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
    : "bg-orange-100 text-orange-700 border border-orange-200";
}

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

  const playerStanding = buildStandings(safePlayers, safeAllMatches).find(
    (row) => row.player_id === playerId
  );

  const wins = playerStanding?.wins ?? 0;
  const losses = playerStanding?.losses ?? 0;
  const points = playerStanding?.points ?? 0;
  const played = playerStanding?.played ?? 0;

  const standings = buildStandings(safePlayers, safeAllMatches);
  const currentPosition =
    standings.findIndex((row) => row.player_id === playerId) + 1;

  const strengthsList = parseStrengths(safePlayer.strengths);

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_28%,#f8fafc_100%)] text-slate-900">
      <div className="mobile-safe-x mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <Link
            href="/jugadores"
            className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            ← Volver a jugadores
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.14),transparent_24%)]" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -bottom-12 left-0 h-40 w-40 rounded-full bg-orange-300/20 blur-3xl" />

          <div className="relative grid lg:grid-cols-[390px_1fr]">
            <div className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(236,254,255,0.8),rgba(255,255,255,1),rgba(254,249,195,0.55))] p-6">
              {safePlayer.photo_url ? (
                <img
                  src={safePlayer.photo_url}
                  alt={safePlayer.name}
                  className="player-hero-photo"
                />
              ) : (
                <div className="flex h-[420px] w-full items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500">
                  Sin fotografía
                </div>
              )}
            </div>

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700">
                  {safePlayer.handedness || "Mano no registrada"}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${
                    safePlayer.active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {safePlayer.active ? "Activo" : "Inactivo"}
                </span>

                {currentPosition > 0 && (
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                    Ranking #{currentPosition}
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
                {safePlayer.name}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {safePlayer.short_description || "Sin descripción breve registrada."}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="tennis-stat-card !p-4">
                  <p className="text-sm text-slate-500">Posición actual</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {currentPosition || "-"}
                  </p>
                </div>

                <div className="tennis-stat-card !p-4">
                  <p className="text-sm text-slate-500">Partidos jugados</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{played}</p>
                </div>

                <div className="tennis-stat-card !p-4">
                  <p className="text-sm text-slate-500">Victorias</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{wins}</p>
                </div>

                <div className="tennis-stat-card !p-4">
                  <p className="text-sm text-slate-500">Derrotas</p>
                  <p className="mt-2 text-3xl font-black text-orange-600">{losses}</p>
                </div>

                <div className="tennis-stat-card !p-4">
                  <p className="text-sm text-slate-500">Puntos</p>
                  <p className="mt-2 text-3xl font-black text-cyan-700">{points}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
                <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
                  <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Perfil del jugador
                    </h2>
                  </div>

                  <div className="space-y-5 p-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Descripción
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {safePlayer.short_description || "Sin descripción breve registrada."}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Estilo de juego
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {safePlayer.play_style || "Sin estilo de juego registrado."}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Mano hábil
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {safePlayer.handedness || "No registrada."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
                  <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-4">
                    <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Fortalezas y lectura rápida
                    </h2>
                  </div>

                  <div className="p-5">
                    {strengthsList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {strengthsList.map((strength) => (
                          <span
                            key={strength}
                            className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-800"
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-slate-700">
                        Sin fortalezas registradas.
                      </p>
                    )}

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          Mejor atributo
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {strengthsList[0] || "No registrado"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          Perfil
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {safePlayer.play_style ? "Definido" : "Pendiente de completar"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          Estado de ficha
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {safePlayer.short_description ||
                          safePlayer.play_style ||
                          safePlayer.strengths
                            ? "Con información"
                            : "Sin completar"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.9),rgba(255,255,255,0.95))] px-6 py-5">
            <h2 className="text-2xl font-black text-slate-950">Resumen por rival</h2>
            <p className="mt-1 text-slate-600">
              Balance de partidos y puntos obtenidos frente a cada adversario.
            </p>
          </div>

          <div className="p-6">
            {rivalSummaries.length === 0 ? (
              <p className="text-slate-600">
                Este jugador aún no registra enfrentamientos.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
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
                      <tr key={summary.rival_id} className="border-t border-slate-200 bg-white">
                        <td className="px-4 py-3">
                          <Link
                            href={`/jugadores/${summary.rival_id}`}
                            className="font-black text-slate-900 hover:text-cyan-700 hover:underline"
                          >
                            {summary.rival_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center">{summary.played}</td>
                        <td className="px-4 py-3 text-center font-black text-emerald-700">
                          {summary.wins}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-orange-700">
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
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.9),rgba(255,255,255,0.95))] px-6 py-5">
            <h2 className="text-2xl font-black text-slate-950">Historial de partidos</h2>
            <p className="mt-1 text-slate-600">
              Todos los resultados registrados del jugador en la escalerilla.
            </p>
          </div>

          <div className="p-6">
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
                      className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            {match.match_date}
                          </p>
                          <h3 className="mt-1 text-lg font-black text-slate-950">
                            {isWinner ? "Victoria" : "Derrota"} ante {opponentName}
                          </h3>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-black ${getResultStyles(
                            isWinner
                          )}`}
                        >
                          {isWinner ? "Ganado" : "Perdido"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                            Marcador
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">{match.score_text}</p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                            Super tie break
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {match.super_tiebreak ? "Sí" : "No"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                            Puntos
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
          </div>
        </section>
      </div>
    </main>
  );
}