export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import type { ReactNode } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { buildStandings } from "../../../lib/standings";
import type { Player } from "../../../types/player";
import type { Match } from "../../../types/match";
import type { Standing } from "../../../types/standing";
import {
  buildFinalBracketPlayers,
  getFinalMatch,
  getNumberValue,
  getPlayerId,
  getPlayerName,
  resolveFinalMatches,
  type BracketPlayer,
  type FinalMatchRow,
  type FinalMatchResolved,
} from "../../../lib/finalBracket";
import {
  inicializarFaseFinal,
  limpiarResultadoFaseFinal,
  reportarResultadoFaseFinal,
} from "./actions";

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

function PlayerSlot({
  player,
  label,
  placeholder = "Por definir",
}: {
  player?: BracketPlayer;
  label?: string;
  placeholder?: string;
}) {
  const name = player ? getPlayerName(player) : placeholder;
  const photoUrl = player?.photo_url ?? null;

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
        <span className="slot-label">
          {label ||
            (player?.seed ? `${player.seed}° fase regular` : "Pendiente")}
        </span>
        <strong>{name}</strong>
        <small>{player ? getPlayerMeta(player) : "Esperando resultado"}</small>
      </div>
    </div>
  );
}

function ResultForm({ match }: { match?: FinalMatchResolved }) {
  if (!match) {
    return (
      <div className="result-box disabled">
        <strong>Partido no disponible</strong>
        <small>Falta cargar este cruce en Supabase.</small>
      </div>
    );
  }

  const player1Id = match.player1 ? getPlayerId(match.player1) : "";
  const player2Id = match.player2 ? getPlayerId(match.player2) : "";
  const winnerId = match.winner ? getPlayerId(match.winner) : "";

  return (
    <div className={`result-box ${match.winner ? "is-played" : ""}`}>
      {match.winner ? (
        <div className="winner-resume">
          <span>Ganador registrado</span>
          <strong>{getPlayerName(match.winner)}</strong>
          {match.score_text && <small>Marcador: {match.score_text}</small>}
        </div>
      ) : (
        <div className="winner-resume">
          <span>Resultado pendiente</span>
          <strong>{match.canReport ? "Listo para reportar" : "Bloqueado"}</strong>
          <small>
            {match.canReport
              ? "Selecciona ganador y marcador."
              : "Se habilita cuando estén definidos ambos jugadores."}
          </small>
        </div>
      )}

      <form action={reportarResultadoFaseFinal} className="report-form">
        <input type="hidden" name="match_key" value={match.match_key} />

        <select
          name="winner_player_id"
          defaultValue={winnerId}
          disabled={!match.canReport}
          required
        >
          <option value="">Seleccionar ganador</option>

          {match.player1 && (
            <option value={player1Id}>{getPlayerName(match.player1)}</option>
          )}

          {match.player2 && (
            <option value={player2Id}>{getPlayerName(match.player2)}</option>
          )}
        </select>

        <input
          name="score_text"
          type="text"
          defaultValue={match.score_text ?? ""}
          placeholder="Marcador: 6-4 / 6-3"
          disabled={!match.canReport}
        />

        <button type="submit" disabled={!match.canReport}>
          {match.winner ? "Actualizar resultado" : "Guardar resultado"}
        </button>
      </form>

      {match.winner && (
        <form action={limpiarResultadoFaseFinal} className="clear-form">
          <input type="hidden" name="match_key" value={match.match_key} />
          <button type="submit">Limpiar resultado</button>
        </form>
      )}
    </div>
  );
}

function MatchCard({
  match,
  title,
  eyebrow,
  top,
  bottom,
  className = "",
}: {
  match?: FinalMatchResolved;
  title: string;
  eyebrow?: string;
  top: ReactNode;
  bottom: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`match-card ${className} ${match?.winner ? "is-played" : ""}`}
    >
      <div className="match-heading">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
      </div>

      <div className="slot-stack">
        {top}
        <div className="versus">vs</div>
        {bottom}
      </div>

      <ResultForm match={match} />
    </article>
  );
}

function AdvanceCard({
  match,
  title,
  eyebrow,
  placeholder,
  className = "",
}: {
  match?: FinalMatchResolved;
  title: string;
  eyebrow: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <article
      className={`advance-card ${className} ${match?.winner ? "is-played" : ""}`}
    >
      <div className="advance-icon">✓</div>

      <div className="advance-info">
        <span>{eyebrow}</span>
        <strong>{match?.winner ? getPlayerName(match.winner) : title}</strong>
        <small>{match?.winner ? "Clasificado confirmado" : placeholder}</small>
      </div>
    </article>
  );
}

function ChampionCard({ finalMatch }: { finalMatch?: FinalMatchResolved }) {
  return (
    <div
      className={`champion-card champion ${
        finalMatch?.winner ? "is-played" : ""
      }`}
    >
      <span>Campeón</span>
      <div className="trophy">🏆</div>
      <strong>
        {finalMatch?.winner ? getPlayerName(finalMatch.winner) : "Por definir"}
      </strong>
      <small>
        {finalMatch?.winner ? "Campeón confirmado" : "Ganador de la final"}
      </small>
    </div>
  );
}

export default async function AdminFaseFinalPage() {
  const [
    { data: playersData, error: playersError },
    { data: matchesData, error: matchesError },
    { data: finalMatchesData, error: finalMatchesError },
  ] = await Promise.all([
    supabase.from("players").select("*"),
    supabase.from("matches").select("*"),
    supabase
      .from("final_matches")
      .select("*")
      .order("order_index", { ascending: true }),
  ]);

  if (playersError) throw new Error(playersError.message);
  if (matchesError) throw new Error(matchesError.message);
  if (finalMatchesError) throw new Error(finalMatchesError.message);

  const players = (playersData ?? []) as Player[];
  const matches = (matchesData ?? []) as Match[];
  const finalRows = (finalMatchesData ?? []) as FinalMatchRow[];

  const standings = buildStandings(players, matches) as Standing[];
  const bracketPlayers = buildFinalBracketPlayers(standings, players);
  const finalMatches = resolveFinalMatches(bracketPlayers, finalRows);

  const seed = (position: number) => bracketPlayers[position - 1];
  const match = (key: string) => getFinalMatch(finalMatches, key);

  const qualy1 = match("qualy_1");
  const qualy2 = match("qualy_2");
  const qualy3 = match("qualy_3");
  const qualy4 = match("qualy_4");
  const qualyA = match("qualy_a");
  const qualyB = match("qualy_b");

  const qf1 = match("qf_1");
  const qf2 = match("qf_2");
  const qf3 = match("qf_3");
  const qf4 = match("qf_4");

  const sf1 = match("sf_1");
  const sf2 = match("sf_2");
  const finalMatch = match("final");

  return (
    <main className="admin-final-page">
      <section className="admin-hero">
        <div>
          <span>Panel administrativo</span>
          <h1>Reportar resultados etapa final</h1>
          <p>
            Registra los resultados directamente sobre la estructura oficial de
            la fase final. Cada ganador avanzará automáticamente al siguiente
            cruce del bracket.
          </p>
        </div>

        <Link href="/fase-final" className="public-link">
          Ver fase final
        </Link>
      </section>

      {finalRows.length === 0 ? (
        <section className="init-card">
          <h2>Inicializar bracket</h2>
          <p>
            La tabla existe, pero aún no tiene cargada la estructura de partidos.
            Presiona el botón una sola vez para crear la llave completa.
          </p>

          <form action={inicializarFaseFinal}>
            <button type="submit">Crear estructura fase final</button>
          </form>
        </section>
      ) : (
        <>
          <section className="section-block qualy-section">
            <div className="section-title">
              <span>Fase previa</span>
              <h2>Bracket Qualy</h2>
              <p>
                Reporta los resultados de los cruces de Qualy. Los ganadores
                avanzarán automáticamente hasta definir los 2 clasificados al
                cuadro principal.
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
                  match={qualy1}
                  className="qualy-match qm1"
                  title="Qualy 1"
                  eyebrow="7° vs 14°"
                  top={<PlayerSlot player={seed(7)} label="7° fase regular" />}
                  bottom={
                    <PlayerSlot player={seed(14)} label="14° fase regular" />
                  }
                />

                <MatchCard
                  match={qualy2}
                  className="qualy-match qm2"
                  title="Qualy 2"
                  eyebrow="8° vs 13°"
                  top={<PlayerSlot player={seed(8)} label="8° fase regular" />}
                  bottom={
                    <PlayerSlot player={seed(13)} label="13° fase regular" />
                  }
                />

                <MatchCard
                  match={qualy3}
                  className="qualy-match qm3"
                  title="Qualy 3"
                  eyebrow="9° vs 12°"
                  top={<PlayerSlot player={seed(9)} label="9° fase regular" />}
                  bottom={
                    <PlayerSlot player={seed(12)} label="12° fase regular" />
                  }
                />

                <MatchCard
                  match={qualy4}
                  className="qualy-match qm4"
                  title="Qualy 4"
                  eyebrow="10° vs 11°"
                  top={
                    <PlayerSlot player={seed(10)} label="10° fase regular" />
                  }
                  bottom={
                    <PlayerSlot player={seed(11)} label="11° fase regular" />
                  }
                />

                <MatchCard
                  match={qualyA}
                  className="qualy-semi qs1"
                  title="Semifinal Qualy A"
                  eyebrow="Camino al 1°"
                  top={
                    <PlayerSlot
                      player={qualyA?.player1}
                      label="Desde Qualy 1"
                      placeholder="Ganador Qualy 1"
                    />
                  }
                  bottom={
                    <PlayerSlot
                      player={qualyA?.player2}
                      label="Desde Qualy 2"
                      placeholder="Ganador Qualy 2"
                    />
                  }
                />

                <MatchCard
                  match={qualyB}
                  className="qualy-semi qs2"
                  title="Semifinal Qualy B"
                  eyebrow="Camino al 2°"
                  top={
                    <PlayerSlot
                      player={qualyB?.player1}
                      label="Desde Qualy 3"
                      placeholder="Ganador Qualy 3"
                    />
                  }
                  bottom={
                    <PlayerSlot
                      player={qualyB?.player2}
                      label="Desde Qualy 4"
                      placeholder="Ganador Qualy 4"
                    />
                  }
                />

                <AdvanceCard
                  match={qualyA}
                  className="qa1"
                  eyebrow="Clasificado Qualy A"
                  title="A cuartos de final"
                  placeholder="Juega contra el 1° de la tabla"
                />

                <AdvanceCard
                  match={qualyB}
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
                Reporta cuartos, semifinales y final. El campeón se mostrará
                automáticamente cuando guardes el resultado de la final.
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
                  match={qf1}
                  className="qf1"
                  title="Cuarto 1"
                  eyebrow="Llave superior"
                  top={<PlayerSlot player={seed(1)} label="1° fase regular" />}
                  bottom={
                    <PlayerSlot
                      player={qf1?.player2}
                      label="Desde Qualy"
                      placeholder="Clasificado Qualy A"
                    />
                  }
                />

                <MatchCard
                  match={qf2}
                  className="qf2"
                  title="Cuarto 2"
                  eyebrow="Llave superior"
                  top={<PlayerSlot player={seed(4)} label="4° fase regular" />}
                  bottom={<PlayerSlot player={seed(5)} label="5° fase regular" />}
                />

                <MatchCard
                  match={qf3}
                  className="qf3"
                  title="Cuarto 3"
                  eyebrow="Llave inferior"
                  top={<PlayerSlot player={seed(3)} label="3° fase regular" />}
                  bottom={<PlayerSlot player={seed(6)} label="6° fase regular" />}
                />

                <MatchCard
                  match={qf4}
                  className="qf4"
                  title="Cuarto 4"
                  eyebrow="Llave inferior"
                  top={<PlayerSlot player={seed(2)} label="2° fase regular" />}
                  bottom={
                    <PlayerSlot
                      player={qf4?.player2}
                      label="Desde Qualy"
                      placeholder="Clasificado Qualy B"
                    />
                  }
                />

                <MatchCard
                  match={sf1}
                  className="sf1"
                  title="Semifinal 1"
                  eyebrow="Llave superior"
                  top={
                    <PlayerSlot
                      player={sf1?.player1}
                      label="Cuartos de final"
                      placeholder="Ganador Cuarto 1"
                    />
                  }
                  bottom={
                    <PlayerSlot
                      player={sf1?.player2}
                      label="Cuartos de final"
                      placeholder="Ganador Cuarto 2"
                    />
                  }
                />

                <MatchCard
                  match={sf2}
                  className="sf2"
                  title="Semifinal 2"
                  eyebrow="Llave inferior"
                  top={
                    <PlayerSlot
                      player={sf2?.player1}
                      label="Cuartos de final"
                      placeholder="Ganador Cuarto 3"
                    />
                  }
                  bottom={
                    <PlayerSlot
                      player={sf2?.player2}
                      label="Cuartos de final"
                      placeholder="Ganador Cuarto 4"
                    />
                  }
                />

                <MatchCard
                  match={finalMatch}
                  className="final"
                  title="Final"
                  eyebrow="Partido decisivo"
                  top={
                    <PlayerSlot
                      player={finalMatch?.player1}
                      label="Semifinal"
                      placeholder="Ganador Semifinal 1"
                    />
                  }
                  bottom={
                    <PlayerSlot
                      player={finalMatch?.player2}
                      label="Semifinal"
                      placeholder="Ganador Semifinal 2"
                    />
                  }
                />

                <ChampionCard finalMatch={finalMatch} />

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
        </>
      )}

      <style>{`
        :root {
          --bg-main: #071113;
          --bg-panel: #0d1b1e;
          --bg-card: #13282c;
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

        .admin-final-page {
          min-height: 100vh;
          padding: 34px;
          color: var(--text-main);
          background:
            radial-gradient(circle at 12% 8%, rgba(214, 178, 94, 0.12), transparent 28%),
            radial-gradient(circle at 88% 12%, rgba(127, 168, 137, 0.12), transparent 30%),
            linear-gradient(135deg, #071113 0%, #0a181b 48%, #071113 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .admin-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          padding: 30px;
          border-radius: 30px;
          background: rgba(13, 27, 30, 0.96);
          border: 1px solid var(--border-soft);
          box-shadow: var(--shadow-soft);
        }

        .admin-hero span,
        .section-title span,
        .match-heading span,
        .round-title,
        .qualy-round-title,
        .advance-info span,
        .champion-card span,
        .winner-resume span {
          text-transform: uppercase;
          letter-spacing: 0.13em;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-gold);
        }

        .admin-hero h1 {
          margin: 8px 0 8px;
          font-size: clamp(2.4rem, 4.8vw, 4.4rem);
          line-height: 0.95;
          letter-spacing: -0.055em;
        }

        .admin-hero p {
          max-width: 780px;
          margin: 0;
          color: var(--text-soft);
          line-height: 1.6;
        }

        .public-link {
          flex-shrink: 0;
          text-decoration: none;
          padding: 12px 17px;
          border-radius: 999px;
          background: rgba(214, 178, 94, 0.14);
          border: 1px solid rgba(214, 178, 94, 0.28);
          color: #ffffff;
          font-weight: 900;
        }

        .init-card,
        .section-block {
          margin-top: 28px;
          padding: 28px;
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(13, 27, 30, 0.94), rgba(7, 17, 19, 0.96));
          border: 1px solid var(--border-soft);
          box-shadow: var(--shadow-soft);
        }

        .init-card h2 {
          margin: 0 0 8px;
        }

        .init-card p {
          color: var(--text-soft);
        }

        .init-card button {
          margin-top: 14px;
          border: 0;
          border-radius: 999px;
          padding: 12px 18px;
          background: var(--accent-gold);
          color: #071113;
          font-weight: 950;
          cursor: pointer;
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
          max-width: 850px;
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

        .match-card.is-played {
          border-color: rgba(214, 178, 94, 0.42);
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

        .result-box {
          margin-top: 12px;
          padding: 12px;
          border-radius: 17px;
          background: rgba(7, 17, 19, 0.48);
          border: 1px solid rgba(226, 232, 240, 0.1);
        }

        .result-box.is-played {
          background: rgba(214, 178, 94, 0.1);
          border-color: rgba(214, 178, 94, 0.22);
        }

        .winner-resume {
          display: grid;
          gap: 3px;
          margin-bottom: 10px;
        }

        .winner-resume strong {
          color: #ffffff;
          font-size: 0.92rem;
        }

        .winner-resume small {
          color: var(--text-muted);
          font-size: 0.76rem;
        }

        .report-form {
          display: grid;
          gap: 8px;
        }

        .report-form select,
        .report-form input {
          width: 100%;
          border: 1px solid rgba(226, 232, 240, 0.15);
          border-radius: 12px;
          padding: 9px 10px;
          background: rgba(7, 17, 19, 0.78);
          color: #ffffff;
          outline: none;
          font-size: 0.82rem;
        }

        .report-form select:disabled,
        .report-form input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .report-form button,
        .clear-form button {
          border: 0;
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 900;
          cursor: pointer;
          font-size: 0.82rem;
        }

        .report-form button {
          background: var(--accent-gold);
          color: #071113;
        }

        .report-form button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .clear-form {
          margin-top: 8px;
        }

        .clear-form button {
          width: 100%;
          background: rgba(239, 68, 68, 0.14);
          color: #fecaca;
          border: 1px solid rgba(239, 68, 68, 0.22);
        }

        .qualy-bracket-wrap,
        .bracket-wrap {
          overflow-x: auto;
          overflow-y: hidden;
          padding: 12px 0 24px;
          -webkit-overflow-scrolling: touch;
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
          grid-template-rows: repeat(8, 255px);
          align-items: center;
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

        .advance-card.is-played {
          background:
            linear-gradient(180deg, rgba(214, 178, 94, 0.14), rgba(11, 24, 27, 0.98));
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
          height: 510px;
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
          height: 510px;
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

        .rt-1 { grid-column: 1; }
        .rt-2 { grid-column: 3; }
        .rt-3 { grid-column: 5; }
        .rt-4 { grid-column: 7; }

        .bracket-canvas {
          position: relative;
          min-width: 1420px;
          display: grid;
          grid-template-columns: 330px 120px 330px 120px 330px 120px 230px;
          grid-template-rows: repeat(8, 255px);
          align-items: center;
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

        .champion-card.is-played {
          background:
            radial-gradient(circle at 50% 0%, rgba(214, 178, 94, 0.32), transparent 62%),
            #102428;
        }

        .champion-card .trophy {
          margin: 8px 0 6px;
          font-size: 2.45rem;
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
          height: 510px;
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
          height: 510px;
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
          height: 1020px;
        }

        .final-mid-h {
          grid-column: 4;
          grid-row: 4 / 6;
        }

        .final-champion-h {
          grid-column: 6;
          grid-row: 4 / 6;
        }

        @media (max-width: 1180px) {
          .admin-final-page {
            padding: 22px;
          }

          .admin-hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .public-link {
            width: 100%;
            text-align: center;
          }
        }

        @media (max-width: 680px) {
          .admin-final-page {
            padding: 14px;
          }

          .admin-hero,
          .section-block,
          .init-card {
            padding: 18px;
            border-radius: 22px;
          }

          .admin-hero h1 {
            font-size: clamp(2rem, 12vw, 3.1rem);
          }

          .admin-hero p,
          .section-title p {
            font-size: 0.92rem;
          }
        }
      `}</style>
    </main>
  );
}