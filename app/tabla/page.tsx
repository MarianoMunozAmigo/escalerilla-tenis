export const dynamic = "force-dynamic";
import { supabase } from "../../lib/supabase";
import type { Player } from "../../types/player";
import type { Match } from "../../types/match";
import type { Standing } from "../../types/standing";
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

  const standingsMap = new Map<number, Standing>();
  const playerMap = new Map<number, Player>();

  safePlayers.forEach((player) => {
    playerMap.set(player.id, player);

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