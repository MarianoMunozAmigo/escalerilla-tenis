export const dynamic = "force-dynamic";
import { supabase } from "../../lib/supabase";
import type { Player } from "../../types/player";
import type { Match } from "../../types/match";
import ModuleHero from "../../components/ModuleHero";

function getPairKey(playerA: number, playerB: number) {
  const min = Math.min(playerA, playerB);
  const max = Math.max(playerA, playerB);
  return `${min}-${max}`;
}

function getStatusStyles(played: number) {
  if (played >= 2) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (played === 1) {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getStatusLabel(played: number) {
  if (played >= 2) return "Completo";
  if (played === 1) return "1 partido";
  return "Disponible";
}

export default async function EnfrentamientosPage() {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true });

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*");

  const safePlayers: Player[] = players ?? [];
  const safeMatches: Match[] = matches ?? [];

  const pairCountMap = new Map<string, number>();

  safeMatches.forEach((match) => {
    const pairKey = getPairKey(match.player_1_id, match.player_2_id);
    pairCountMap.set(pairKey, (pairCountMap.get(pairKey) ?? 0) + 1);
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <ModuleHero
          title="Control de enfrentamientos"
          description="Visualización del estado de cruces por jugador, con seguimiento del máximo permitido de partidos por pareja."
        />

        {(playersError || matchesError) && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error al cargar enfrentamientos: {playersError?.message || matchesError?.message}
          </p>
        )}

        {!playersError && !matchesError && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {safePlayers.map((player) => {
              const rivals = safePlayers.filter((rival) => rival.id !== player.id);

              return (
                <article
                  key={player.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black">{player.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Estado de sus enfrentamientos
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 px-3 py-2 text-xs font-black text-white shadow">
                      {rivals.length} rivales
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {rivals.map((rival) => {
                      const pairKey = getPairKey(player.id, rival.id);
                      const played = pairCountMap.get(pairKey) ?? 0;

                      return (
                        <div
                          key={rival.id}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 ${getStatusStyles(
                            played
                          )}`}
                        >
                          <span className="text-sm font-semibold">{rival.name}</span>
                          <span className="text-xs font-black">
                            {played}/2 · {getStatusLabel(played)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}