export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { supabase } from "../../lib/supabase";
import { buildStandings } from "../../lib/standings";
import type { Player } from "../../types/player";
import type { Match } from "../../types/match";
import type { TablePlayer } from "../../types/table-player";
import TableModule from "../../components/TableModule";

export default async function TablaPage() {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .order("id", { ascending: true });

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false })
    .order("id", { ascending: false });

  if (playersError || matchesError) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error al calcular la tabla: {playersError?.message || matchesError?.message}
          </p>
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

  const tablePlayers: TablePlayer[] = standings.map((standing) => {
    const player = playerMap.get(standing.player_id);

    const playerMatches = safeMatches.filter(
      (match) =>
        match.player_1_id === standing.player_id || match.player_2_id === standing.player_id
    );

    const chronologicalMatches = [...playerMatches].reverse();

    let streakType: "W" | "L" | null = null;
    let streakCount = 0;

    for (let i = chronologicalMatches.length - 1; i >= 0; i--) {
      const match = chronologicalMatches[i];
      const result: "W" | "L" =
        match.winner_id === standing.player_id ? "W" : "L";

      if (!streakType) {
        streakType = result;
        streakCount = 1;
      } else if (streakType === result) {
        streakCount += 1;
      } else {
        break;
      }
    }

    const streak =
      streakType && streakCount > 0 ? `${streakType}${streakCount}` : "-";

    const lastResults = playerMatches
      .slice(0, 5)
      .map((match) => (match.winner_id === standing.player_id ? "W" : "L"));

    return {
      player_id: standing.player_id,
      player_name: standing.player_name,
      photo_url: player?.photo_url ?? null,
      played: standing.played,
      wins: standing.wins,
      losses: standing.losses,
      points: standing.points,
      sets_won: standing.sets_won,
      sets_lost: standing.sets_lost,
      set_difference: standing.set_difference,
      games_won: standing.games_won,
      games_lost: standing.games_lost,
      game_difference: standing.game_difference,
      streak,
      last_results: lastResults,
    };
  });

  const totalMatches = safeMatches.length;
  const totalPlayers = safePlayers.length;
  const totalPoints = standings.reduce((acc, row) => acc + row.points, 0);

  return (
    <TableModule
      standings={tablePlayers}
      totalMatches={totalMatches}
      totalPlayers={totalPlayers}
      totalPoints={totalPoints}
    />
  );
}