import type { Match } from "../types/match";
import type { Player } from "../types/player";
import type { Standing } from "../types/standing";

type ParsedScore = {
  winnerSetsWon: number;
  loserSetsWon: number;
  winnerGamesWon: number;
  loserGamesWon: number;
};

function parseScoreText(scoreText: string): ParsedScore {
  const result: ParsedScore = {
    winnerSetsWon: 0,
    loserSetsWon: 0,
    winnerGamesWon: 0,
    loserGamesWon: 0,
  };

  if (!scoreText) return result;

  const tokens = scoreText
    .replaceAll(",", " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const match = token.match(/^(\d+)\s*[-–:]\s*(\d+)$/);

    if (!match) continue;

    const winnerGames = Number(match[1]);
    const loserGames = Number(match[2]);

    if (Number.isNaN(winnerGames) || Number.isNaN(loserGames)) continue;

    result.winnerGamesWon += winnerGames;
    result.loserGamesWon += loserGames;

    if (winnerGames > loserGames) {
      result.winnerSetsWon += 1;
    } else if (loserGames > winnerGames) {
      result.loserSetsWon += 1;
    }
  }

  return result;
}

export function buildStandings(players: Player[], matches: Match[]): Standing[] {
  const standingsMap = new Map<number, Standing>();

  players.forEach((player) => {
    standingsMap.set(player.id, {
      player_id: player.id,
      player_name: player.name,
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      sets_won: 0,
      sets_lost: 0,
      set_difference: 0,
      games_won: 0,
      games_lost: 0,
      game_difference: 0,
    });
  });

  matches.forEach((match) => {
    const winner = standingsMap.get(match.winner_id);
    const loser = standingsMap.get(match.loser_id);

    if (!winner || !loser) return;

    const parsed = parseScoreText(match.score_text);

    winner.played += 1;
    winner.wins += 1;
    winner.points += match.winner_points;
    winner.sets_won += parsed.winnerSetsWon;
    winner.sets_lost += parsed.loserSetsWon;
    winner.games_won += parsed.winnerGamesWon;
    winner.games_lost += parsed.loserGamesWon;

    loser.played += 1;
    loser.losses += 1;
    loser.points += match.loser_points;
    loser.sets_won += parsed.loserSetsWon;
    loser.sets_lost += parsed.winnerSetsWon;
    loser.games_won += parsed.loserGamesWon;
    loser.games_lost += parsed.winnerGamesWon;
  });

  const standings = Array.from(standingsMap.values()).map((standing) => ({
    ...standing,
    set_difference: standing.sets_won - standing.sets_lost,
    game_difference: standing.games_won - standing.games_lost,
  }));

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.game_difference !== a.game_difference) {
      return b.game_difference - a.game_difference;
    }
    if (b.games_won !== a.games_won) return b.games_won - a.games_won;
    if (b.set_difference !== a.set_difference) {
      return b.set_difference - a.set_difference;
    }
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.player_name.localeCompare(b.player_name, "es");
  });

  return standings;
}