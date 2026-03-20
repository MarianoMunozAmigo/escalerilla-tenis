export const dynamic = "force-dynamic";
import { supabase } from "../../lib/supabase";
import type { Player } from "../../types/player";
import type { Match } from "../../types/match";
import ModuleHero from "../../components/ModuleHero";

export default async function PartidosPage() {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*");

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false })
    .order("id", { ascending: false });

  const safePlayers: Player[] = players ?? [];
  const safeMatches: Match[] = matches ?? [];

  const playerMap = new Map<number, string>();
  safePlayers.forEach((player) => {
    playerMap.set(player.id, player.name);
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <ModuleHero
          title="Partidos registrados"
          description="Historial completo de los encuentros disputados en la competencia."
        />

        {(playersError || matchesError) && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error al cargar partidos: {playersError?.message || matchesError?.message}
          </p>
        )}

        {!playersError && !matchesError && (
          <div className="mt-8 space-y-4">
            {safeMatches.map((match) => (
              <article
                key={match.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-black">
                    {playerMap.get(match.winner_id) ?? `Jugador ${match.winner_id}`} venció a{" "}
                    {playerMap.get(match.loser_id) ?? `Jugador ${match.loser_id}`}
                  </h2>

                  <span className="rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 px-3 py-1 text-xs font-black text-slate-950">
                    {match.match_date}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Marcador
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{match.score_text}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Super tie break
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {match.super_tiebreak ? "Sí" : "No"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Puntos ganador
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{match.winner_points}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Puntos perdedor
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{match.loser_points}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}