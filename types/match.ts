export type Match = {
  id: number;
  player_1_id: number;
  player_2_id: number;
  winner_id: number;
  loser_id: number;
  score_text: string;
  super_tiebreak: boolean;
  winner_points: number;
  loser_points: number;
  match_date: string;
  created_at: string;
  edition_id?: string | null;
};
