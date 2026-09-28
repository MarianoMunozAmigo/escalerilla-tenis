export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getActiveEdition } from "../../lib/editions";
import type { Player } from "../../types/player";
import type { Match } from "../../types/match";

export default async function PartidosPage() {
  const activeEdition = await getActiveEdition();

  const [
    { data: playersData, error: playersError },
    { data: matchesData, error: matchesError },
  ] = await Promise.all([
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

  if (playersError || matchesError) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error al cargar partidos: {playersError?.message || matchesError?.message}
          </p>
        </div>
      </main>
    );
  }

  const players: Player[] = playersData ?? [];
  const matches: Match[] = matchesData ?? [];
  const playerMap = new Map<number, Player>();
  players.forEach((player) => playerMap.set(player.id, player));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            {activeEdition.name}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Partidos registrados
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Historial de resultados cargados para la edición activa.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          {matches.length > 0 ? (
            matches.map((match) => {
              const winner = playerMap.get(match.winner_id);
              const loser = playerMap.get(match.loser_id);

              return (
                <article
                  key={match.id}
                  className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">
                        {winner?.name ?? `Jugador ${match.winner_id}`} venció a{" "}
                        {loser?.name ?? `Jugador ${match.loser_id}`}
                      </h2>

                      <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                        <p>Marcador: {match.score_text}</p>
                        <p>Fecha: {match.match_date}</p>
                        <p>Super tie break: {match.super_tiebreak ? "Sí" : "No"}</p>
                        <p>
                          Puntos: {match.winner_points} - {match.loser_points}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/jugadores/${match.winner_id}`}
                      className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-center text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
                    >
                      Ver ganador
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.6rem] border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
              Aún no hay partidos registrados en esta edición.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
