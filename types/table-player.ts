export type TablePlayer = {
  player_id: number;
  player_name: string;
  photo_url?: string | null;
  played: number;
  wins: number;
  losses: number;
  points: number;
  sets_won: number;
  sets_lost: number;
  set_difference: number;
  games_won: number;
  games_lost: number;
  game_difference: number;
  streak: string;
  last_results: ("W" | "L")[];
};