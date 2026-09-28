export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { getActiveEdition } from "../../../lib/editions";
import { buildStandings } from "../../../lib/standings";
import type { Player } from "../../../types/player";
import type { Match } from "../../../types/match";

type PlayerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function parseStrengths(value?: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function PlayerProfilePage({ params }: PlayerPageProps) {
  const { id } = await params;
  const playerId = Number(id);

  if (!playerId || Number.isNaN(playerId)) {
    notFound();
  }

  const activeEdition = await getActiveEdition();

  const [
    { data: player, error: playerError },
    { data: playersData, error: playersError },
    { data: allMatchesData, error: allMatchesError },
  ] = await Promise.all([
    supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .eq("edition_id", activeEdition.id)
      .single(),
    supabase
      .from("players")
      .select("*")
      .eq("edition_id", activeEdition.id)
      .order("name", { ascending: true }),
    supabase
      .from("matches")
      .select("*")
      .eq("edition_id", activeEdition.id)
      .order("match_date", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  if (playerError || !player) {
    notFound();
  }

  if (playersError || allMatchesError) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error al cargar perfil: {playersError?.message || allMatchesError?.message}
          </p>
        </div>
      </main>
    );
  }

  const safePlayers: Player[] = playersData ?? [];
  const allMatches: Match[] = allMatchesData ?? [];
  const playerMatches = allMatches.filter(
    (match) => match.player_1_id === playerId || match.player_2_id === playerId
  );

  const standings = buildStandings(safePlayers, allMatches);
  const standing = standings.find((row) => row.player_id === playerId);

  const playerMap = new Map<number, Player>();
  safePlayers.forEach((item) => playerMap.set(item.id, item));

  const strengths = parseStrengths(player.strengths);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_30%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/jugadores"
          className="inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
        >
          ← Volver a jugadores
        </Link>

        <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex h-[430px] items-center justify-center bg-gradient-to-b from-cyan-50 via-white to-yellow-50 p-6">
              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={player.name}
                  className="h-full w-full rounded-[1.6rem] object-cover object-[center_20%]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-100 text-slate-500">
                  Sin fotografía
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
              {activeEdition.name}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {player.name}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                {player.handedness || "Mano no registrada"}
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {player.active ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">Partidos</p>
                <p className="mt-1 text-2xl font-black">{standing?.played ?? 0}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">Victorias</p>
                <p className="mt-1 text-2xl font-black text-emerald-600">
                  {standing?.wins ?? 0}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">Puntos</p>
                <p className="mt-1 text-2xl font-black text-cyan-700">
                  {standing?.points ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-5">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                  Descripción
                </h2>

                <p className="mt-2 leading-7 text-slate-700">
                  {player.short_description || "Sin descripción breve registrada."}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                  Estilo de juego
                </h2>

                <p className="mt-2 leading-7 text-slate-700">
                  {player.play_style || "Sin estilo de juego registrado."}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                  Fortalezas
                </h2>

                {strengths.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {strengths.map((strength) => (
                      <span
                        key={strength}
                        className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-slate-500">Sin fortalezas registradas.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Partidos del jugador</h2>

          <div className="mt-5 space-y-3">
            {playerMatches.length > 0 ? (
              playerMatches.map((match) => {
                const winner = playerMap.get(match.winner_id);
                const loser = playerMap.get(match.loser_id);

                return (
                  <article
                    key={match.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <h3 className="font-black">
                      {winner?.name ?? `Jugador ${match.winner_id}`} venció a{" "}
                      {loser?.name ?? `Jugador ${match.loser_id}`}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      {match.match_date} · {match.score_text} · Puntos:{" "}
                      {match.winner_points} - {match.loser_points}
                    </p>
                  </article>
                );
              })
            ) : (
              <p className="text-slate-600">
                Aún no hay partidos registrados para este jugador en esta edición.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
