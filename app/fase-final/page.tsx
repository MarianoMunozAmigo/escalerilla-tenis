export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import type { ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import { buildStandings } from "../../lib/standings";
import type { Player } from "../../types/player";
import type { Match } from "../../types/match";
import type { Standing } from "../../types/standing";

type BracketPlayer = Standing & {
  photo_url?: string | null;
  display_name?: string;
  seed?: number;
};

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" ? (value as RawRecord) : {};
}

function getTextValue(source: unknown, keys: string[]): string {
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

function getNumberValue(source: unknown, keys: string[]): number | null {
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

function getEntityId(source: unknown): string {
  return getTextValue(source, ["player_id", "playerId", "jugador_id", "id"]);
}

function getDisplayName(source?: unknown, fallback = ""): string {
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

function getPhotoUrl(source?: unknown): string | null {
  const photo = getTextValue(source, [
    "photo_url",
    "foto_url",
    "avatar_url",
    "image_url",
    "imagen_url",
  ]);

  return photo || null;
}

function getInitials(name: string): string {
  const clean = name.trim();

  if (!clean) return "?";

  const parts = clean.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getPlayerMeta(player: BracketPlayer): string {
  const points = getNumberValue(player, ["points", "puntos", "pts", "score"]);
  const played = getNumberValue(player, [
    "played",
    "pj",
    "partidos",
    "matches_played",
    "matchesPlayed",
    "partidos_jugados",
  ]);

  const items: string[] = [];

  if (points !== null) items.push(`${points} pts`);
  if (played !== null) items.push(`${played} PJ`);

  return items.length ? items.join(" · ") : "Clasificado";
}

function buildBracketPlayers(
  standings: Standing[],
  players: Player[]
): BracketPlayer[] {
  const playerById = new Map<string, Player>();

  players.forEach((player) => {
    const id = getEntityId(player);
    if (id) playerById.set(id, player);
  });

  return standings.map((standing, index) => {
    const standingId = getEntityId(standing);
    const playerRow = standingId ? playerById.get(standingId) : undefined;

    const displayName =
      getDisplayName(standing) ||
      getDisplayName(playerRow) ||
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

function PlayerSlot({
  player,
  label,
  placeholder = "Por definir",
}: {
  player?: BracketPlayer;
  label?: string;
  placeholder?: string;
}) {
  const name = player
    ? player.display_name || getDisplayName(player, "Jugador")
    : placeholder;

  const photoUrl = player?.photo_url || getPhotoUrl(player);
  const slotLabel =
    label || (player?.seed ? `${player.seed}° lugar` : "Pendiente");

  return (
    <div className={`player-slot ${!player ? "is-placeholder" : ""}`}>
      <div className="photo-shell">
        {photoUrl ? (
          <img src={photoUrl} alt={name} />
        ) : (
          <span>{player ? getInitials(name) : "?"}</span>
        )}
      </div>

      <div className="player-info">
        <span className="slot-label">{slotLabel}</span>
        <strong>{name}</strong>
        <small>{player ? getPlayerMeta(player) : "Esperando resultado"}</small>
      </div>
    </div>
  );
}

function MatchCard({
  title,
  eyebrow,
  top,
  bottom,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  top: ReactNode;
  bottom: ReactNode;
  className?: string;
}) {
  return (
    <article className={`match-card ${className}`}>
      <div className="match-heading">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>

      <div className="slot-stack">
        {top}
        <div className="versus">vs</div>
        {bottom}
      </div>
    </article>
  );
}

function AdvanceCard({
  title,
  eyebrow,
  placeholder,
  className = "",
}: {
  title: string;
  eyebrow: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <article className={`advance-card ${className}`}>
      <div className="advance-icon">✓</div>

      <div className="advance-info">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
        <small>{placeholder}</small>
      </div>
    </article>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="phase-page">
      <section className="empty-state">
        <span>Fase final</span>
        <h1>No se pudo cargar el cuadro</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}

export default async function FaseFinalPage() {
  const [
    { data: playersData, error: playersError },
    { data: matchesData, error: matchesError },
  ] = await Promise.all([
    supabase.from("players").select("*"),
    supabase.from("matches").select("*"),
  ]);

  if (playersError) {
    return <ErrorState message={playersError.message} />;
  }

  if (matchesError) {
    return <ErrorState message={matchesError.message} />;
  }

  const players = (playersData ?? []) as Player[];
  const matches = (matchesData ?? []) as Match[];

  const standings = buildStandings(players, matches) as Standing[];
  const bracketPlayers = buildBracketPlayers(standings, players);

  const seed = (position: number) => bracketPlayers[position - 1];

  const directCount = bracketPlayers.slice(0, 6).filter(Boolean).length;
  const qualyCount = bracketPlayers.slice(6, 14).filter(Boolean).length;

  return (
    <main className="phase-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>Escalerilla Tenis · 3° edición</span>
          </div>

          <h1>Camino al campeón</h1>

          <p>
            La fase final reúne a los mejores clasificados de la tabla y a los
            jugadores que buscarán su cupo desde la qualy. Una llave ordenada
            para seguir cada cruce hasta conocer al campeón.
          </p>

          <div className="hero-meta">
            <span>Fase regular + qualy</span>
            <span>Cuartos, semifinales y final</span>
          </div>
        </div>

        <div className="hero-summary">
          <div className="summary-card">
            <span>Clasificados directos</span>
            <strong>{directCount}/6</strong>
            <small>Ingresan al cuadro principal</small>
          </div>

          <div className="summary-card">
            <span>Jugadores en qualy</span>
            <strong>{qualyCount}/8</strong>
            <small>Compiten por 2 cupos</small>
          </div>
        </div>
      </section>

      <section className="section-block qualy-section">
        <div className="section-title">
          <span>Fase previa</span>
          <h2>Bracket Qualy</h2>
          <p>
            Los puestos 7° al 14° disputan la fase previa. La llave avanza hasta
            definir 2 clasificados, quienes ingresan al cuadro principal contra
            el 1° y el 2° de la fase regular.
          </p>
        </div>

        <div className="qualy-bracket-wrap">
          <div className="qualy-rounds-header">
            <span className="qualy-round-title qrt-1">Primera ronda</span>
            <span className="qualy-round-title qrt-2">Semifinal Qualy</span>
            <span className="qualy-round-title qrt-3">Clasificados</span>
          </div>

          <div className="qualy-canvas">
            <MatchCard
              className="qualy-match qm1"
              title="Qualy 1"
              eyebrow="7° vs 14°"
              top={<PlayerSlot player={seed(7)} label="7° fase regular" />}
              bottom={<PlayerSlot player={seed(14)} label="14° fase regular" />}
            />

            <MatchCard
              className="qualy-match qm2"
              title="Qualy 2"
              eyebrow="8° vs 13°"
              top={<PlayerSlot player={seed(8)} label="8° fase regular" />}
              bottom={<PlayerSlot player={seed(13)} label="13° fase regular" />}
            />

            <MatchCard
              className="qualy-match qm3"
              title="Qualy 3"
              eyebrow="9° vs 12°"
              top={<PlayerSlot player={seed(9)} label="9° fase regular" />}
              bottom={<PlayerSlot player={seed(12)} label="12° fase regular" />}
            />

            <MatchCard
              className="qualy-match qm4"
              title="Qualy 4"
              eyebrow="10° vs 11°"
              top={<PlayerSlot player={seed(10)} label="10° fase regular" />}
              bottom={<PlayerSlot player={seed(11)} label="11° fase regular" />}
            />

            <MatchCard
              className="qualy-semi qs1"
              title="Semifinal Qualy A"
              eyebrow="Camino al 1°"
              top={
                <PlayerSlot
                  label="Desde Qualy 2"
                  placeholder="Ganador Qualy 2"
                />
              }
              bottom={
                <PlayerSlot
                  label="Desde Qualy 3"
                  placeholder="Ganador Qualy 3"
                />
              }
            />

            <MatchCard
              className="qualy-semi qs2"
              title="Semifinal Qualy B"
              eyebrow="Camino al 2°"
              top={
                <PlayerSlot
                  label="Desde Qualy 1"
                  placeholder="Ganador Qualy 1"
                />
              }
              bottom={
                <PlayerSlot
                  label="Desde Qualy 4"
                  placeholder="Ganador Qualy 4"
                />
              }
            />

            <AdvanceCard
              className="qa1"
              eyebrow="Clasificado Qualy A"
              title="A cuartos de final"
              placeholder="Juega contra el 1° de la tabla"
            />

            <AdvanceCard
              className="qa2"
              eyebrow="Clasificado Qualy B"
              title="A cuartos de final"
              placeholder="Juega contra el 2° de la tabla"
            />

            <div className="bracket-line h q1-h" />
            <div className="bracket-line h q2-h" />
            <div className="bracket-line v q-a-v" />
            <div className="bracket-line h q-a-mid" />

            <div className="bracket-line h q3-h" />
            <div className="bracket-line h q4-h" />
            <div className="bracket-line v q-b-v" />
            <div className="bracket-line h q-b-mid" />

            <div className="bracket-line h qsf-a-final" />
            <div className="bracket-line h qsf-b-final" />
          </div>
        </div>
      </section>

      <section className="section-block bracket-section">
        <div className="section-title">
          <span>Cuadro principal</span>
          <h2>Definición del campeón</h2>
          <p>
            Los 6 mejores de la fase regular ingresan directo al cuadro
            principal. Los 2 clasificados de la qualy completan los cuartos de
            final contra el 1° y 2° de la tabla.
          </p>
        </div>

        <div className="bracket-wrap">
          <div className="rounds-header">
            <span className="round-title rt-1">Cuartos de final</span>
            <span className="round-title rt-2">Semifinales</span>
            <span className="round-title rt-3">Final</span>
            <span className="round-title rt-4">Campeón</span>
          </div>

          <div className="bracket-canvas">
            <MatchCard
              className="qf1"
              title="Cuarto 1"
              eyebrow="Llave superior"
              top={<PlayerSlot player={seed(1)} label="1° fase regular" />}
              bottom={
                <PlayerSlot
                  label="Desde Qualy"
                  placeholder="Clasificado Qualy A"
                />
              }
            />

            <MatchCard
              className="qf2"
              title="Cuarto 2"
              eyebrow="Llave superior"
              top={<PlayerSlot player={seed(4)} label="4° fase regular" />}
              bottom={<PlayerSlot player={seed(5)} label="5° fase regular" />}
            />

            <MatchCard
              className="qf3"
              title="Cuarto 3"
              eyebrow="Llave inferior"
              top={<PlayerSlot player={seed(3)} label="3° fase regular" />}
              bottom={<PlayerSlot player={seed(6)} label="6° fase regular" />}
            />

            <MatchCard
              className="qf4"
              title="Cuarto 4"
              eyebrow="Llave inferior"
              top={<PlayerSlot player={seed(2)} label="2° fase regular" />}
              bottom={
                <PlayerSlot
                  label="Desde Qualy"
                  placeholder="Clasificado Qualy B"
                />
              }
            />

            <MatchCard
              className="sf1"
              title="Semifinal 1"
              eyebrow="Llave superior"
              top={
                <PlayerSlot
                  label="Cuartos de final"
                  placeholder="Ganador Cuarto 1"
                />
              }
              bottom={
                <PlayerSlot
                  label="Cuartos de final"
                  placeholder="Ganador Cuarto 2"
                />
              }
            />

            <MatchCard
              className="sf2"
              title="Semifinal 2"
              eyebrow="Llave inferior"
              top={
                <PlayerSlot
                  label="Cuartos de final"
                  placeholder="Ganador Cuarto 3"
                />
              }
              bottom={
                <PlayerSlot
                  label="Cuartos de final"
                  placeholder="Ganador Cuarto 4"
                />
              }
            />

            <MatchCard
              className="final"
              title="Final"
              eyebrow="Partido decisivo"
              top={
                <PlayerSlot
                  label="Semifinal"
                  placeholder="Ganador Semifinal 1"
                />
              }
              bottom={
                <PlayerSlot
                  label="Semifinal"
                  placeholder="Ganador Semifinal 2"
                />
              }
            />

            <div className="champion-card champion">
              <span>Campeón</span>
              <div className="trophy">🏆</div>
              <strong>Por definir</strong>
              <small>Ganador de la final</small>
            </div>

            <div className="bracket-line h qf1-h" />
            <div className="bracket-line h qf2-h" />
            <div className="bracket-line v sf1-v" />
            <div className="bracket-line h sf1-mid-h" />

            <div className="bracket-line h qf3-h" />
            <div className="bracket-line h qf4-h" />
            <div className="bracket-line v sf2-v" />
            <div className="bracket-line h sf2-mid-h" />

            <div className="bracket-line h sf1-final-h" />
            <div className="bracket-line h sf2-final-h" />
            <div className="bracket-line v final-v" />
            <div className="bracket-line h final-mid-h" />

            <div className="bracket-line h final-champion-h" />
          </div>
        </div>
      </section>

      <style>{`
        :root {
          --bg-main: #071113;
          --bg-panel: #0d1b1e;
          --bg-panel-soft: #102428;
          --bg-card: #13282c;
          --bg-card-soft: #182f34;

          --border-soft: rgba(226, 232, 240, 0.12);
          --border-medium: rgba(226, 232, 240, 0.18);

          --text-main: #f8fafc;
          --text-soft: rgba(226, 232, 240, 0.78);
          --text-muted: rgba(203, 213, 225, 0.62);

          --accent-gold: #d6b25e;
          --accent-green: #7fa889;

          --shadow-soft: 0 18px 45px rgba(0, 0, 0, 0.28);
          --shadow-card: 0 14px 32px rgba(0, 0, 0, 0.24);
        }

        .phase-page {
          min-height: 100vh;
          padding: 34px;
          color: var(--text-main);
          background:
            radial-gradient(circle at 12% 8%, rgba(214, 178, 94, 0.12), transparent 28%),
            radial-gradient(circle at 88% 12%, rgba(127, 168, 137, 0.12), transparent 30%),
            linear-gradient(135deg, #071113 0%, #0a181b 48%, #071113 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hero {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 28px;
          align-items: stretch;
          padding: 34px;
          border: 1px solid var(--border-soft);
          border-radius: 32px;
          background:
            linear-gradient(135deg, rgba(19, 40, 44, 0.98), rgba(7, 17, 19, 0.96)),
            var(--bg-panel);
          box-shadow: var(--shadow-soft);
        }

        .hero::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 18% 0%, rgba(214, 178, 94, 0.18), transparent 34%),
            radial-gradient(circle at 92% 24%, rgba(127, 168, 137, 0.16), transparent 34%);
        }

        .hero::after {
          content: "";
          position: absolute;
          right: -80px;
          bottom: -120px;
          width: 320px;
          height: 320px;
          border-radius: 999px;
          border: 1px solid rgba(214, 178, 94, 0.16);
          background: rgba(214, 178, 94, 0.035);
        }

        .hero-copy,
        .hero-summary {
          position: relative;
          z-index: 1;
        }

        .hero-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .hero-badge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(214, 178, 94, 0.1);
          border: 1px solid rgba(214, 178, 94, 0.18);
          color: rgba(246, 232, 196, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.68rem;
          font-weight: 900;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--accent-gold);
          box-shadow: 0 0 18px rgba(214, 178, 94, 0.65);
        }

        .hero h1 {
          max-width: 840px;
          margin: 18px 0 14px;
          font-size: clamp(2.6rem, 5.6vw, 5.2rem);
          line-height: 0.92;
          letter-spacing: -0.065em;
          color: #ffffff;
        }

        .hero p {
          max-width: 780px;
          margin: 0;
          color: var(--text-soft);
          line-height: 1.65;
          font-size: 1.02rem;
        }

        .hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .hero-meta span {
          padding: 8px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(226, 232, 240, 0.1);
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 750;
        }

        .hero-summary {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .summary-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 128px;
          padding: 20px;
          border-radius: 24px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.025));
          border: 1px solid var(--border-soft);
        }

        .summary-card span,
        .page-kicker,
        .section-title span,
        .match-heading span,
        .round-title,
        .qualy-round-title,
        .advance-info span,
        .champion-card span {
          text-transform: uppercase;
          letter-spacing: 0.13em;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-gold);
        }

        .summary-card strong {
          margin-top: 7px;
          font-size: 2.35rem;
          line-height: 1;
          color: #ffffff;
          letter-spacing: -0.04em;
        }

        .summary-card small {
          margin-top: 7px;
          color: var(--text-muted);
          font-size: 0.82rem;
        }

        .section-block {
          margin-top: 28px;
          padding: 28px;
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(13, 27, 30, 0.94), rgba(7, 17, 19, 0.96));
          border: 1px solid var(--border-soft);
          box-shadow: var(--shadow-soft);
        }

        .section-title {
          margin-bottom: 24px;
        }

        .section-title h2 {
          margin: 5px 0 8px;
          font-size: clamp(1.6rem, 3vw, 2.5rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
          color: #ffffff;
        }

        .section-title p {
          max-width: 800px;
          margin: 0;
          color: var(--text-soft);
          line-height: 1.6;
        }

        .match-card {
          position: relative;
          z-index: 3;
          min-width: 0;
          width: 100%;
          padding: 15px;
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(24, 47, 52, 0.98), rgba(15, 31, 35, 0.98));
          border: 1px solid var(--border-medium);
          box-shadow: var(--shadow-card);
        }

        .match-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(135deg, rgba(214, 178, 94, 0.08), transparent 38%),
            linear-gradient(315deg, rgba(127, 168, 137, 0.08), transparent 42%);
        }

        .match-heading {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 11px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.08);
        }

        .match-heading h3 {
          margin: 0;
          font-size: 0.98rem;
          color: #ffffff;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }

        .match-heading span {
          color: var(--text-muted);
        }

        .slot-stack {
          position: relative;
          display: grid;
          gap: 9px;
        }

        .player-slot {
          display: grid;
          grid-template-columns: 58px 1fr;
          align-items: center;
          gap: 12px;
          min-height: 70px;
          padding: 9px 10px;
          border-radius: 17px;
          background: rgba(7, 17, 19, 0.42);
          border: 1px solid rgba(226, 232, 240, 0.1);
        }

        .player-slot.is-placeholder {
          background: rgba(7, 17, 19, 0.3);
          border: 1px dashed rgba(226, 232, 240, 0.18);
          color: var(--text-muted);
        }

        .photo-shell {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          overflow: hidden;
          display: grid;
          place-items: center;
          background:
            linear-gradient(135deg, rgba(214, 178, 94, 0.22), rgba(127, 168, 137, 0.16)),
            #0b1719;
          border: 1px solid rgba(226, 232, 240, 0.14);
          box-shadow: inset 0 1px 12px rgba(255, 255, 255, 0.04);
        }

        .photo-shell img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .photo-shell span {
          font-size: 1rem;
          font-weight: 900;
          color: #ffffff;
        }

        .player-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .slot-label {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--accent-green);
        }

        .player-info strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.98rem;
          color: #ffffff;
        }

        .player-info small {
          font-size: 0.76rem;
          color: var(--text-muted);
        }

        .versus {
          justify-self: center;
          margin: -1px 0;
          padding: 2px 9px;
          border-radius: 999px;
          background: rgba(214, 178, 94, 0.12);
          border: 1px solid rgba(214, 178, 94, 0.18);
          font-size: 0.62rem;
          font-weight: 900;
          text-transform: uppercase;
          color: rgba(246, 232, 196, 0.88);
        }

        .qualy-bracket-wrap,
        .bracket-wrap {
          overflow-x: auto;
          padding: 12px 0 24px;
        }

        .qualy-bracket-wrap::-webkit-scrollbar,
        .bracket-wrap::-webkit-scrollbar {
          height: 10px;
        }

        .qualy-bracket-wrap::-webkit-scrollbar-track,
        .bracket-wrap::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
        }

        .qualy-bracket-wrap::-webkit-scrollbar-thumb,
        .bracket-wrap::-webkit-scrollbar-thumb {
          background: rgba(214, 178, 94, 0.28);
          border-radius: 999px;
        }

        .qualy-rounds-header {
          min-width: 1580px;
          display: grid;
          grid-template-columns: 360px 140px 360px 140px 320px;
          align-items: center;
          margin-bottom: 30px;
        }

        .qrt-1 { grid-column: 1; }
        .qrt-2 { grid-column: 3; }
        .qrt-3 { grid-column: 5; }

        .qualy-canvas {
          position: relative;
          min-width: 1580px;
          display: grid;
          grid-template-columns: 360px 140px 360px 140px 320px;
          grid-template-rows: repeat(8, 170px);
          align-items: center;
        }

        .qualy-match,
        .qualy-semi {
          align-self: center;
        }

        .qualy-canvas .match-card {
          max-width: 360px;
        }

        .qm1 { grid-column: 1; grid-row: 1 / 3; }
        .qm2 { grid-column: 1; grid-row: 3 / 5; }
        .qm3 { grid-column: 1; grid-row: 5 / 7; }
        .qm4 { grid-column: 1; grid-row: 7 / 9; }

        .qs1 { grid-column: 3; grid-row: 2 / 4; }
        .qs2 { grid-column: 3; grid-row: 6 / 8; }

        .advance-card {
          position: relative;
          z-index: 3;
          min-height: 120px;
          padding: 20px;
          border-radius: 22px;
          display: grid;
          grid-template-columns: 44px 1fr;
          align-items: center;
          gap: 12px;
          background:
            linear-gradient(180deg, rgba(16, 36, 40, 0.98), rgba(11, 24, 27, 0.98));
          border: 1px solid rgba(214, 178, 94, 0.28);
          box-shadow: var(--shadow-card);
        }

        .qa1 { grid-column: 5; grid-row: 2 / 4; }
        .qa2 { grid-column: 5; grid-row: 6 / 8; }

        .advance-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(214, 178, 94, 0.16);
          border: 1px solid rgba(214, 178, 94, 0.28);
          color: var(--accent-gold);
          font-size: 1.1rem;
          font-weight: 900;
        }

        .advance-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .advance-info strong {
          color: #ffffff;
          font-size: 0.98rem;
        }

        .advance-info small {
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        .bracket-line {
          position: relative;
          z-index: 1;
          background: rgba(214, 178, 94, 0.5);
          box-shadow: 0 0 14px rgba(214, 178, 94, 0.12);
          border-radius: 999px;
          pointer-events: none;
        }

        .bracket-line.h {
          height: 2px;
          align-self: center;
          justify-self: stretch;
        }

        .bracket-line.v {
          width: 2px;
          justify-self: center;
          align-self: center;
        }

        .q1-h { grid-column: 2; grid-row: 1 / 3; }
        .q2-h { grid-column: 2; grid-row: 3 / 5; }

        .q-a-v {
          grid-column: 2;
          grid-row: 1 / 5;
          height: 340px;
        }

        .q-a-mid {
          grid-column: 2;
          grid-row: 2 / 4;
        }

        .q3-h { grid-column: 2; grid-row: 5 / 7; }
        .q4-h { grid-column: 2; grid-row: 7 / 9; }

        .q-b-v {
          grid-column: 2;
          grid-row: 5 / 9;
          height: 340px;
        }

        .q-b-mid {
          grid-column: 2;
          grid-row: 6 / 8;
        }

        .qsf-a-final {
          grid-column: 4;
          grid-row: 2 / 4;
        }

        .qsf-b-final {
          grid-column: 4;
          grid-row: 6 / 8;
        }

        .rounds-header {
          min-width: 1420px;
          display: grid;
          grid-template-columns: 330px 120px 330px 120px 330px 120px 230px;
          align-items: center;
          margin-bottom: 26px;
        }

        .round-title {
          padding-left: 8px;
          color: var(--accent-gold);
        }

        .rt-1 { grid-column: 1; }
        .rt-2 { grid-column: 3; }
        .rt-3 { grid-column: 5; }
        .rt-4 { grid-column: 7; }

        .bracket-canvas {
          position: relative;
          min-width: 1420px;
          display: grid;
          grid-template-columns: 330px 120px 330px 120px 330px 120px 230px;
          grid-template-rows: repeat(8, 165px);
          align-items: center;
        }

        .bracket-canvas .match-card {
          align-self: center;
        }

        .qf1 { grid-column: 1; grid-row: 1 / 3; }
        .qf2 { grid-column: 1; grid-row: 3 / 5; }
        .qf3 { grid-column: 1; grid-row: 5 / 7; }
        .qf4 { grid-column: 1; grid-row: 7 / 9; }

        .sf1 { grid-column: 3; grid-row: 2 / 4; }
        .sf2 { grid-column: 3; grid-row: 6 / 8; }

        .final { grid-column: 5; grid-row: 4 / 6; }

        .champion-card {
          grid-column: 7;
          grid-row: 4 / 6;
          align-self: center;
          min-height: 220px;
          padding: 22px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
          text-align: center;
          background:
            linear-gradient(180deg, rgba(30, 41, 59, 0.28), rgba(7, 17, 19, 0.56)),
            radial-gradient(circle at 50% 0%, rgba(214, 178, 94, 0.24), transparent 58%),
            #102428;
          border: 1px solid rgba(214, 178, 94, 0.34);
          box-shadow: var(--shadow-card);
        }

        .champion-card .trophy {
          margin: 8px 0 6px;
          font-size: 2.45rem;
          filter: drop-shadow(0 8px 18px rgba(214, 178, 94, 0.2));
        }

        .champion-card strong {
          font-size: 1.18rem;
          color: #ffffff;
        }

        .champion-card small {
          margin-top: 4px;
          color: var(--text-muted);
        }

        .qf1-h { grid-column: 2; grid-row: 1 / 3; }
        .qf2-h { grid-column: 2; grid-row: 3 / 5; }

        .sf1-v {
          grid-column: 2;
          grid-row: 1 / 5;
          height: 330px;
        }

        .sf1-mid-h {
          grid-column: 2;
          grid-row: 2 / 4;
        }

        .qf3-h { grid-column: 2; grid-row: 5 / 7; }
        .qf4-h { grid-column: 2; grid-row: 7 / 9; }

        .sf2-v {
          grid-column: 2;
          grid-row: 5 / 9;
          height: 330px;
        }

        .sf2-mid-h {
          grid-column: 2;
          grid-row: 6 / 8;
        }

        .sf1-final-h { grid-column: 4; grid-row: 2 / 4; }
        .sf2-final-h { grid-column: 4; grid-row: 6 / 8; }

        .final-v {
          grid-column: 4;
          grid-row: 2 / 8;
          height: 660px;
        }

        .final-mid-h {
          grid-column: 4;
          grid-row: 4 / 6;
        }

        .final-champion-h {
          grid-column: 6;
          grid-row: 4 / 6;
        }

        .empty-state {
          max-width: 680px;
          margin: 80px auto;
          padding: 36px;
          border-radius: 28px;
          background: rgba(13, 27, 30, 0.94);
          border: 1px solid var(--border-soft);
          text-align: center;
          box-shadow: var(--shadow-soft);
        }

        .empty-state span {
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--accent-gold);
        }

        .empty-state h1 {
          margin: 10px 0;
        }

        .empty-state p {
          color: var(--text-soft);
        }

        @media (max-width: 1180px) {
          .phase-page {
            padding: 22px;
          }

          .hero {
            grid-template-columns: 1fr;
          }

          .hero-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 1023px) {
          .phase-page {
            padding: 18px;
          }

          .hero {
            padding: 24px;
            border-radius: 26px;
          }

          .hero h1 {
            font-size: clamp(2.25rem, 11vw, 4rem);
          }

          .hero-summary {
            grid-template-columns: 1fr;
          }

          .summary-card {
            min-height: auto;
          }

          .qualy-bracket-wrap,
          .bracket-wrap {
            overflow-x: visible;
            padding: 0;
          }

          .qualy-rounds-header,
          .rounds-header {
            display: none;
          }

          .qualy-canvas,
          .bracket-canvas {
            min-width: 0;
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: none;
            gap: 16px;
          }

          .qualy-canvas > *,
          .bracket-canvas > * {
            grid-column: auto !important;
            grid-row: auto !important;
          }

          .qualy-canvas .match-card,
          .bracket-canvas .match-card,
          .advance-card,
          .champion-card {
            width: 100%;
            max-width: none;
          }

          .bracket-line {
            display: none;
          }

          .qualy-section .qualy-match::before,
          .qualy-section .qualy-semi::before,
          .bracket-section .match-card::before {
            opacity: 0.75;
          }

          .advance-card {
            min-height: auto;
          }
        }

        @media (max-width: 680px) {
          .phase-page {
            padding: 14px;
          }

          .hero,
          .section-block {
            padding: 18px;
            border-radius: 22px;
          }

          .hero {
            gap: 18px;
          }

          .hero-badge {
            font-size: 0.62rem;
            letter-spacing: 0.09em;
          }

          .hero h1 {
            margin-top: 14px;
            font-size: clamp(2.05rem, 14vw, 3.2rem);
            line-height: 0.96;
          }

          .hero p {
            font-size: 0.94rem;
            line-height: 1.58;
          }

          .hero-meta {
            margin-top: 16px;
          }

          .hero-meta span {
            font-size: 0.72rem;
          }

          .summary-card {
            padding: 16px;
            border-radius: 20px;
          }

          .summary-card strong {
            font-size: 2rem;
          }

          .section-block {
            margin-top: 18px;
          }

          .section-title {
            margin-bottom: 18px;
          }

          .section-title h2 {
            font-size: 1.55rem;
          }

          .section-title p {
            font-size: 0.92rem;
          }

          .match-card {
            padding: 13px;
            border-radius: 20px;
          }

          .match-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 4px;
          }

          .match-heading h3 {
            font-size: 0.96rem;
            white-space: normal;
          }

          .player-slot {
            grid-template-columns: 50px 1fr;
            min-height: 64px;
            gap: 10px;
            padding: 8px;
            border-radius: 15px;
          }

          .photo-shell {
            width: 50px;
            height: 50px;
            border-radius: 14px;
          }

          .player-info strong {
            font-size: 0.92rem;
          }

          .player-info small {
            font-size: 0.72rem;
          }

          .slot-label {
            font-size: 0.6rem;
          }

          .advance-card {
            grid-template-columns: 38px 1fr;
            padding: 15px;
            border-radius: 20px;
          }

          .advance-icon {
            width: 38px;
            height: 38px;
          }

          .champion-card {
            min-height: 170px;
          }
        }
      `}</style>
    </main>
  );
}