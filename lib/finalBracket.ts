import type { Player } from "../types/player";
import type { Standing } from "../types/standing";

export type BracketPlayer = Standing & {
  photo_url?: string | null;
  display_name?: string;
  seed?: number;
};

export type FinalMatchRow = {
  id?: string;
  match_key: string;
  stage: string;
  title: string;
  bracket_side?: string | null;
  order_index: number;

  player1_seed?: number | null;
  player2_seed?: number | null;

  player1_from_match?: string | null;
  player2_from_match?: string | null;

  winner_player_id?: string | null;
  score_text?: string | null;
  played_at?: string | null;
  status?: string | null;
  notes?: string | null;
};

export type FinalMatchResolved = FinalMatchRow & {
  player1?: BracketPlayer;
  player2?: BracketPlayer;
  player1Placeholder: string;
  player2Placeholder: string;
  winner?: BracketPlayer;
  canReport: boolean;
};

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" ? (value as RawRecord) : {};
}

export function getTextValue(source: unknown, keys: string[]): string {
  const row = asRecord(source);

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

export function getNumberValue(source: unknown, keys: string[]): number | null {
  const row = asRecord(source);

  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(",", "."));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

export function getPlayerId(source: unknown): string {
  return getTextValue(source, ["player_id", "playerId", "jugador_id", "id"]);
}

export function getPlayerName(source?: unknown, fallback = "Jugador"): string {
  const directName = getTextValue(source, [
    "display_name",
    "name",
    "nombre",
    "player_name",
    "nombre_completo",
  ]);

  if (directName) return directName;

  const nombres = getTextValue(source, ["nombres", "first_name"]);
  const apellidoPaterno = getTextValue(source, [
    "apellido_paterno",
    "last_name",
    "apellido",
  ]);
  const apellidoMaterno = getTextValue(source, ["apellido_materno"]);

  const fullName = [nombres, apellidoPaterno, apellidoMaterno]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || fallback;
}

export function getPhotoUrl(source?: unknown): string | null {
  const photo = getTextValue(source, [
    "photo_url",
    "foto_url",
    "avatar_url",
    "image_url",
    "imagen_url",
  ]);

  return photo || null;
}

export function buildFinalBracketPlayers(
  standings: Standing[],
  players: Player[]
): BracketPlayer[] {
  const playerById = new Map<string, Player>();

  players.forEach((player) => {
    const id = getPlayerId(player);
    if (id) playerById.set(id, player);
  });

  return standings.map((standing, index) => {
    const standingId = getPlayerId(standing);
    const playerRow = standingId ? playerById.get(standingId) : undefined;

    const displayName =
      getPlayerName(standing, "") ||
      getPlayerName(playerRow, "") ||
      `Jugador ${index + 1}`;

    const photoUrl = getPhotoUrl(standing) || getPhotoUrl(playerRow);

    return {
      ...standing,
      display_name: displayName,
      photo_url: photoUrl,
      seed: index + 1,
    } as BracketPlayer;
  });
}

export const FINAL_MATCH_SEED_ROWS: FinalMatchRow[] = [
  {
    match_key: "qualy_1",
    stage: "qualy_round",
    title: "Qualy 1",
    bracket_side: "upper_path",
    order_index: 1,
    player1_seed: 7,
    player2_seed: 14,
    player1_from_match: null,
    player2_from_match: null,
  },
  {
    match_key: "qualy_2",
    stage: "qualy_round",
    title: "Qualy 2",
    bracket_side: "upper_path",
    order_index: 2,
    player1_seed: 8,
    player2_seed: 13,
    player1_from_match: null,
    player2_from_match: null,
  },
  {
    match_key: "qualy_3",
    stage: "qualy_round",
    title: "Qualy 3",
    bracket_side: "lower_path",
    order_index: 3,
    player1_seed: 9,
    player2_seed: 12,
    player1_from_match: null,
    player2_from_match: null,
  },
  {
    match_key: "qualy_4",
    stage: "qualy_round",
    title: "Qualy 4",
    bracket_side: "lower_path",
    order_index: 4,
    player1_seed: 10,
    player2_seed: 11,
    player1_from_match: null,
    player2_from_match: null,
  },
  {
    match_key: "qualy_a",
    stage: "qualy_semifinal",
    title: "Semifinal Qualy A",
    bracket_side: "upper_path",
    order_index: 5,
    player1_seed: null,
    player2_seed: null,
    player1_from_match: "qualy_1",
    player2_from_match: "qualy_2",
  },
  {
    match_key: "qualy_b",
    stage: "qualy_semifinal",
    title: "Semifinal Qualy B",
    bracket_side: "lower_path",
    order_index: 6,
    player1_seed: null,
    player2_seed: null,
    player1_from_match: "qualy_3",
    player2_from_match: "qualy_4",
  },
  {
    match_key: "qf_1",
    stage: "quarterfinal",
    title: "Cuarto 1",
    bracket_side: "upper_path",
    order_index: 7,
    player1_seed: 1,
    player2_seed: null,
    player1_from_match: null,
    player2_from_match: "qualy_a",
  },
  {
    match_key: "qf_2",
    stage: "quarterfinal",
    title: "Cuarto 2",
    bracket_side: "upper_path",
    order_index: 8,
    player1_seed: 4,
    player2_seed: 5,
    player1_from_match: null,
    player2_from_match: null,
  },
  {
    match_key: "qf_3",
    stage: "quarterfinal",
    title: "Cuarto 3",
    bracket_side: "lower_path",
    order_index: 9,
    player1_seed: 3,
    player2_seed: 6,
    player1_from_match: null,
    player2_from_match: null,
  },
  {
    match_key: "qf_4",
    stage: "quarterfinal",
    title: "Cuarto 4",
    bracket_side: "lower_path",
    order_index: 10,
    player1_seed: 2,
    player2_seed: null,
    player1_from_match: null,
    player2_from_match: "qualy_b",
  },
  {
    match_key: "sf_1",
    stage: "semifinal",
    title: "Semifinal 1",
    bracket_side: "upper_path",
    order_index: 11,
    player1_seed: null,
    player2_seed: null,
    player1_from_match: "qf_1",
    player2_from_match: "qf_2",
  },
  {
    match_key: "sf_2",
    stage: "semifinal",
    title: "Semifinal 2",
    bracket_side: "lower_path",
    order_index: 12,
    player1_seed: null,
    player2_seed: null,
    player1_from_match: "qf_3",
    player2_from_match: "qf_4",
  },
  {
    match_key: "final",
    stage: "final",
    title: "Final",
    bracket_side: "championship",
    order_index: 13,
    player1_seed: null,
    player2_seed: null,
    player1_from_match: "sf_1",
    player2_from_match: "sf_2",
  },
];

function getFallbackTitle(matchKey: string): string {
  const found = FINAL_MATCH_SEED_ROWS.find((row) => row.match_key === matchKey);
  return found?.title ?? matchKey;
}

export function resolveFinalMatches(
  bracketPlayers: BracketPlayer[],
  rows: FinalMatchRow[]
): FinalMatchResolved[] {
  const sortedRows = [...rows].sort((a, b) => a.order_index - b.order_index);

  const playerById = new Map<string, BracketPlayer>();

  bracketPlayers.forEach((player) => {
    const id = getPlayerId(player);
    if (id) playerById.set(id, player);
  });

  const resolvedByKey = new Map<string, FinalMatchResolved>();

  function resolveSeed(seed?: number | null): BracketPlayer | undefined {
    if (!seed) return undefined;
    return bracketPlayers[seed - 1];
  }

  function resolveFromMatch(matchKey?: string | null): BracketPlayer | undefined {
    if (!matchKey) return undefined;
    return resolvedByKey.get(matchKey)?.winner;
  }

  function placeholderFromMatch(matchKey?: string | null): string {
    if (!matchKey) return "Por definir";
    return `Ganador ${getFallbackTitle(matchKey)}`;
  }

  const resolved = sortedRows.map((row) => {
    const player1 =
      resolveSeed(row.player1_seed) || resolveFromMatch(row.player1_from_match);

    const player2 =
      resolveSeed(row.player2_seed) || resolveFromMatch(row.player2_from_match);

    const player1Placeholder = row.player1_seed
      ? `${row.player1_seed}° fase regular`
      : placeholderFromMatch(row.player1_from_match);

    const player2Placeholder = row.player2_seed
      ? `${row.player2_seed}° fase regular`
      : placeholderFromMatch(row.player2_from_match);

    const winner = row.winner_player_id
      ? playerById.get(String(row.winner_player_id))
      : undefined;

    const item: FinalMatchResolved = {
      ...row,
      player1,
      player2,
      player1Placeholder,
      player2Placeholder,
      winner,
      canReport: Boolean(player1 && player2),
    };

    resolvedByKey.set(row.match_key, item);

    return item;
  });

  return resolved;
}

export function getFinalMatch(
  matches: FinalMatchResolved[],
  matchKey: string
): FinalMatchResolved | undefined {
  return matches.find((match) => match.match_key === matchKey);
}

export function getFinalWinner(
  matches: FinalMatchResolved[],
  matchKey: string
): BracketPlayer | undefined {
  return getFinalMatch(matches, matchKey)?.winner;
}