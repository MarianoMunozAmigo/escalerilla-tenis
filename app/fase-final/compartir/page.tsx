export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { buildStandings } from "../../../lib/standings";
import type { Player } from "../../../types/player";
import type { Match } from "../../../types/match";
import type { Standing } from "../../../types/standing";
import {
  buildFinalBracketPlayers,
  FINAL_MATCH_SEED_ROWS,
  getFinalMatch,
  getPlayerId,
  getPlayerName,
  resolveFinalMatches,
  type BracketPlayer,
  type FinalMatchResolved,
  type FinalMatchRow,
} from "../../../lib/finalBracket";
import ExportBracketImage from "./ExportBracketImage";

function getInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return "?";

  const parts = clean.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function readNumber(source: unknown, keys: string[]): number | null {
  const row =
    source && typeof source === "object"
      ? (source as Record<string, unknown>)
      : {};

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

function getPlayerMeta(player?: BracketPlayer): string {
  if (!player) return "Esperando resultado";

  const points = readNumber(player, ["points", "puntos", "pts", "score"]);
  const played = readNumber(player, [
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

function PlayerPill({
  player,
  label,
  placeholder,
  winner,
}: {
  player?: BracketPlayer;
  label: string;
  placeholder: string;
  winner?: BracketPlayer;
}) {
  const name = player ? getPlayerName(player) : placeholder;
  const photoUrl = player?.photo_url ?? null;

  const isWinner =
    Boolean(player && winner && getPlayerId(player) === getPlayerId(winner));

  return (
    <div
      className={`poster-player ${!player ? "is-pending" : ""} ${
        isWinner ? "is-winner" : ""
      }`}
    >
      <div className="poster-photo">
        {photoUrl ? (
          <img src={photoUrl} alt={name} crossOrigin="anonymous" />
        ) : (
          <span>{player ? getInitials(name) : "?"}</span>
        )}
      </div>

      <div className="poster-player-info">
        <span>{label}</span>
        <strong>{name}</strong>
        <small>{player ? getPlayerMeta(player) : "Esperando resultado"}</small>
      </div>
    </div>
  );
}

function MatchPosterCard({
  match,
  className,
  title,
  eyebrow,
  topPlayer,
  topLabel,
  topPlaceholder,
  bottomPlayer,
  bottomLabel,
  bottomPlaceholder,
}: {
  match?: FinalMatchResolved;
  className: string;
  title: string;
  eyebrow: string;
  topPlayer?: BracketPlayer;
  topLabel: string;
  topPlaceholder: string;
  bottomPlayer?: BracketPlayer;
  bottomLabel: string;
  bottomPlaceholder: string;
}) {
  return (
    <article
      className={`poster-match ${className} ${
        match?.winner ? "is-played" : ""
      }`}
    >
      <div className="poster-match-head">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </div>

      <div className="poster-slots">
        <PlayerPill
          player={topPlayer}
          label={topLabel}
          placeholder={topPlaceholder}
          winner={match?.winner}
        />

        <div className="poster-vs">vs</div>

        <PlayerPill
          player={bottomPlayer}
          label={bottomLabel}
          placeholder={bottomPlaceholder}
          winner={match?.winner}
        />
      </div>

      {match?.winner && (
        <div className="poster-result">
          <span>Ganador</span>
          <strong>{getPlayerName(match.winner)}</strong>
          {match.score_text && <small>{match.score_text}</small>}
        </div>
      )}
    </article>
  );
}

function ChampionCenterCard({
  finalMatch,
}: {
  finalMatch?: FinalMatchResolved;
}) {
  return (
    <article
      className={`poster-champion ${finalMatch?.winner ? "is-played" : ""}`}
    >
      <span>Campeón</span>

      <div className="poster-trophy-wrap">
        <div className="poster-trophy-ring" />
        <div className="poster-trophy">
          <svg
            viewBox="0 0 64 64"
            aria-hidden="true"
            role="img"
            fill="none"
          >
            <path
              d="M22 10h20v8c0 7.2-4.2 13.2-10 15.6C26.2 31.2 22 25.2 22 18v-8Z"
              fill="url(#cupGradient)"
              stroke="#F7E7A7"
              strokeWidth="2"
            />
            <path
              d="M22 14H14c0 8 3.8 13 10 13"
              stroke="#F7E7A7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M42 14h8c0 8-3.8 13-10 13"
              stroke="#F7E7A7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M28 34h8v7c0 2.8 1.7 5.3 4.2 6.3l3.8 1.5V54H20v-5.2l3.8-1.5c2.5-1 4.2-3.5 4.2-6.3v-7Z"
              fill="url(#baseGradient)"
              stroke="#F7E7A7"
              strokeWidth="2"
            />
            <path
              d="M24 54h16"
              stroke="#F7E7A7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="cupGradient" x1="22" y1="10" x2="42" y2="34">
                <stop stopColor="#FFF4B8" />
                <stop offset="0.55" stopColor="#E4BE56" />
                <stop offset="1" stopColor="#B8860B" />
              </linearGradient>
              <linearGradient id="baseGradient" x1="20" y1="34" x2="44" y2="54">
                <stop stopColor="#F3D47A" />
                <stop offset="1" stopColor="#A77414" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <strong>
        {finalMatch?.winner ? getPlayerName(finalMatch.winner) : "Por definir"}
      </strong>

      <small>
        {finalMatch?.winner
          ? "Ganador de la 3° edición"
          : "Esperando resultado final"}
      </small>

      {finalMatch?.score_text && (
        <em>Resultado final: {finalMatch.score_text}</em>
      )}
    </article>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="share-page">
      <section className="share-error">
        <span>Cuadro final</span>
        <h1>No se pudo cargar la vista para compartir</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}

export default async function CompartirFaseFinalPage() {
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

  if (playersError) return <ErrorState message={playersError.message} />;
  if (matchesError) return <ErrorState message={matchesError.message} />;
  if (finalMatchesError) return <ErrorState message={finalMatchesError.message} />;

  const players = (playersData ?? []) as Player[];
  const matches = (matchesData ?? []) as Match[];

  const finalRows =
    finalMatchesData && finalMatchesData.length > 0
      ? ((finalMatchesData ?? []) as FinalMatchRow[])
      : FINAL_MATCH_SEED_ROWS;

  const standings = buildStandings(players, matches) as Standing[];
  const bracketPlayers = buildFinalBracketPlayers(standings, players);
  const finalMatches = resolveFinalMatches(bracketPlayers, finalRows);

  const seed = (position: number) => bracketPlayers[position - 1];
  const match = (key: string) => getFinalMatch(finalMatches, key);

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
    <main className="share-page">
      <div className="share-top-actions">
        <Link href="/fase-final">Volver a fase final</Link>
        <Link href="/admin/fase-final">Reportar resultados</Link>
      </div>

      <ExportBracketImage>
        <section className="poster-final">
          <div className="poster-bg-orb poster-bg-orb-a" />
          <div className="poster-bg-orb poster-bg-orb-b" />

          <header className="poster-header">
            <div>
              <div className="poster-kicker">
                Escalerilla Locos x el Tenis · 3° edición
              </div>
              <h1>Cuadro final</h1>
              <p>
                Vista especial para compartir · formato optimizado para descarga
              </p>
            </div>

            <div className="poster-status">
              <span>Fase final</span>
              <strong>
                {finalMatch?.winner ? "Campeón definido" : "En desarrollo"}
              </strong>
              <small>Actualizado según resultados reportados</small>
            </div>
          </header>

          <div className="poster-board">
            <div className="poster-side-title left">Lado izquierdo</div>
            <div className="poster-side-title right">Lado derecho</div>

            <MatchPosterCard
              match={qf1}
              className="pm-qf1"
              title="Cuarto 1"
              eyebrow="Llave izquierda"
              topPlayer={seed(1)}
              topLabel="1° fase regular"
              topPlaceholder="1° fase regular"
              bottomPlayer={qf1?.player2 ?? qualyA?.winner}
              bottomLabel="Desde Qualy"
              bottomPlaceholder="Clasificado Qualy A"
            />

            <MatchPosterCard
              match={qf2}
              className="pm-qf2"
              title="Cuarto 2"
              eyebrow="Llave izquierda"
              topPlayer={seed(4)}
              topLabel="4° fase regular"
              topPlaceholder="4° fase regular"
              bottomPlayer={seed(5)}
              bottomLabel="5° fase regular"
              bottomPlaceholder="5° fase regular"
            />

            <MatchPosterCard
              match={qf3}
              className="pm-qf3"
              title="Cuarto 3"
              eyebrow="Llave derecha"
              topPlayer={seed(3)}
              topLabel="3° fase regular"
              topPlaceholder="3° fase regular"
              bottomPlayer={seed(6)}
              bottomLabel="6° fase regular"
              bottomPlaceholder="6° fase regular"
            />

            <MatchPosterCard
              match={qf4}
              className="pm-qf4"
              title="Cuarto 4"
              eyebrow="Llave derecha"
              topPlayer={seed(2)}
              topLabel="2° fase regular"
              topPlaceholder="2° fase regular"
              bottomPlayer={qf4?.player2 ?? qualyB?.winner}
              bottomLabel="Desde Qualy"
              bottomPlaceholder="Clasificado Qualy B"
            />

            <MatchPosterCard
              match={sf1}
              className="pm-sf1"
              title="Semifinal izquierda"
              eyebrow="Cruce previo a la final"
              topPlayer={sf1?.player1}
              topLabel="Ganador"
              topPlaceholder="Ganador Cuarto 1"
              bottomPlayer={sf1?.player2}
              bottomLabel="Ganador"
              bottomPlaceholder="Ganador Cuarto 2"
            />

            <MatchPosterCard
              match={sf2}
              className="pm-sf2"
              title="Semifinal derecha"
              eyebrow="Cruce previo a la final"
              topPlayer={sf2?.player1}
              topLabel="Ganador"
              topPlaceholder="Ganador Cuarto 3"
              bottomPlayer={sf2?.player2}
              bottomLabel="Ganador"
              bottomPlaceholder="Ganador Cuarto 4"
            />

            <MatchPosterCard
              match={finalMatch}
              className="pm-final"
              title="Gran final"
              eyebrow="Partido decisivo"
              topPlayer={finalMatch?.player1}
              topLabel="Desde semifinal"
              topPlaceholder="Ganador Semifinal Izq."
              bottomPlayer={finalMatch?.player2}
              bottomLabel="Desde semifinal"
              bottomPlaceholder="Ganador Semifinal Der."
            />

            <ChampionCenterCard finalMatch={finalMatch} />

            <div className="poster-line h l-qf1" />
            <div className="poster-line h l-qf2" />
            <div className="poster-line v l-qf-left-v" />
            <div className="poster-line h l-qf-left-mid" />

            <div className="poster-line h l-qf3" />
            <div className="poster-line h l-qf4" />
            <div className="poster-line v l-qf-right-v" />
            <div className="poster-line h l-qf-right-mid" />

            <div className="poster-line h l-sf1-final" />
            <div className="poster-line h l-sf2-final" />
            <div className="poster-line h l-final-champion" />
          </div>

          <footer className="poster-footer">
            <span>Escalerilla de Tenis</span>
            <strong>Locos x el Tenis</strong>
            <small>Imagen generada desde el sistema oficial de resultados</small>
          </footer>
        </section>
      </ExportBracketImage>

      <style>{`
        .share-page {
          min-height: 100vh;
          padding: 28px;
          color: #f8fafc;
          background:
            radial-gradient(circle at 12% 8%, rgba(214, 178, 94, 0.12), transparent 28%),
            radial-gradient(circle at 88% 12%, rgba(127, 168, 137, 0.12), transparent 30%),
            linear-gradient(135deg, #071113 0%, #0a181b 48%, #071113 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .share-top-actions {
          max-width: 2400px;
          margin: 0 auto 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .share-top-actions a {
          text-decoration: none;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(214, 178, 94, 0.12);
          border: 1px solid rgba(214, 178, 94, 0.25);
          color: #ffffff;
          font-weight: 900;
          font-size: 0.86rem;
        }

        .share-export-shell {
          max-width: 2400px;
          margin: 0 auto;
        }

        .share-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 20px;
          margin-bottom: 16px;
          border-radius: 22px;
          background: rgba(13, 27, 30, 0.96);
          border: 1px solid rgba(226, 232, 240, 0.12);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.26);
        }

        .share-toolbar div {
          display: grid;
          gap: 3px;
        }

        .share-toolbar span,
        .poster-kicker,
        .poster-status span,
        .poster-side-title,
        .poster-match-head span,
        .poster-player-info span,
        .poster-result span,
        .poster-champion span,
        .poster-footer span {
          text-transform: uppercase;
          letter-spacing: 0.13em;
          font-size: 0.7rem;
          font-weight: 900;
          color: #d6b25e;
        }

        .share-toolbar strong {
          color: #ffffff;
          font-size: 1.02rem;
        }

        .share-toolbar small {
          color: rgba(226, 232, 240, 0.68);
        }

        .share-toolbar button {
          flex-shrink: 0;
          border: 0;
          border-radius: 999px;
          padding: 13px 18px;
          background: #d6b25e;
          color: #071113;
          font-weight: 950;
          cursor: pointer;
        }

        .share-toolbar button:disabled {
          opacity: 0.62;
          cursor: wait;
        }

        .share-message {
          max-width: 2400px;
          margin: -4px auto 14px;
          color: rgba(226, 232, 240, 0.74);
          font-size: 0.9rem;
        }

        .poster-scroll {
          width: 100%;
          overflow: auto;
          padding-bottom: 16px;
        }

        .poster-capture {
          width: 2400px;
          height: 1350px;
        }

        .poster-final {
          position: relative;
          overflow: hidden;
          width: 2400px;
          height: 1350px;
          padding: 72px;
          box-sizing: border-box;
          color: #f8fafc;
          background:
            radial-gradient(circle at 12% 8%, rgba(214, 178, 94, 0.16), transparent 28%),
            radial-gradient(circle at 90% 18%, rgba(127, 168, 137, 0.16), transparent 30%),
            linear-gradient(135deg, #071113 0%, #0b1a1d 48%, #071113 100%);
          border: 1px solid rgba(226, 232, 240, 0.08);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .poster-bg-orb {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          border: 1px solid rgba(214, 178, 94, 0.12);
          background: rgba(214, 178, 94, 0.035);
        }

        .poster-bg-orb-a {
          width: 520px;
          height: 520px;
          right: -130px;
          top: 80px;
        }

        .poster-bg-orb-b {
          width: 420px;
          height: 420px;
          left: -150px;
          bottom: -120px;
        }

        .poster-header {
          position: absolute;
          left: 72px;
          top: 54px;
          right: 72px;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          gap: 48px;
          align-items: flex-start;
        }

        .poster-header h1 {
          margin: 10px 0 8px;
          font-size: 96px;
          line-height: 0.92;
          letter-spacing: -0.065em;
          color: #ffffff;
        }

        .poster-header p {
          margin: 0;
          max-width: 900px;
          color: rgba(226, 232, 240, 0.78);
          font-size: 26px;
          line-height: 1.4;
        }

        .poster-status {
          width: 380px;
          padding: 26px;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(226, 232, 240, 0.13);
          display: grid;
          gap: 6px;
        }

        .poster-status strong {
          color: #ffffff;
          font-size: 30px;
        }

        .poster-status small {
          color: rgba(226, 232, 240, 0.64);
          font-size: 16px;
        }

        .poster-board {
          position: absolute;
          left: 72px;
          top: 285px;
          width: 2256px;
          height: 930px;
        }

        .poster-side-title {
          position: absolute;
          top: -30px;
        }

        .poster-side-title.left {
          left: 0;
        }

        .poster-side-title.right {
          right: 0;
        }

        .poster-match {
          position: absolute;
          z-index: 3;
          width: 390px;
          min-height: 220px;
          padding: 16px;
          border-radius: 24px;
          box-sizing: border-box;
          background:
            linear-gradient(180deg, rgba(24, 47, 52, 0.98), rgba(15, 31, 35, 0.98));
          border: 1px solid rgba(226, 232, 240, 0.17);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.24);
        }

        .poster-match.is-played {
          border-color: rgba(214, 178, 94, 0.42);
        }

        .poster-match-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 10px;
          margin-bottom: 11px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.09);
        }

        .poster-match-head strong {
          color: #ffffff;
          font-size: 20px;
          white-space: nowrap;
        }

        .poster-slots {
          display: grid;
          gap: 8px;
        }

        .poster-player {
          display: grid;
          grid-template-columns: 58px 1fr;
          align-items: center;
          gap: 12px;
          min-height: 68px;
          padding: 8px 10px;
          border-radius: 18px;
          background: rgba(7, 17, 19, 0.46);
          border: 1px solid rgba(226, 232, 240, 0.1);
        }

        .poster-player.is-winner {
          border-color: rgba(214, 178, 94, 0.5);
          background: rgba(214, 178, 94, 0.12);
        }

        .poster-player.is-pending {
          border-style: dashed;
          color: rgba(203, 213, 225, 0.65);
        }

        .poster-photo {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          overflow: hidden;
          display: grid;
          place-items: center;
          background:
            linear-gradient(135deg, rgba(214, 178, 94, 0.22), rgba(127, 168, 137, 0.16)),
            #0b1719;
          border: 1px solid rgba(226, 232, 240, 0.13);
        }

        .poster-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .poster-photo span {
          font-size: 18px;
          font-weight: 950;
          color: #ffffff;
        }

        .poster-player-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .poster-player-info strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #ffffff;
          font-size: 18px;
        }

        .poster-player-info small {
          color: rgba(203, 213, 225, 0.67);
          font-size: 13px;
        }

        .poster-vs {
          justify-self: center;
          margin: -1px 0;
          padding: 2px 10px;
          border-radius: 999px;
          background: rgba(214, 178, 94, 0.12);
          border: 1px solid rgba(214, 178, 94, 0.2);
          color: rgba(246, 232, 196, 0.92);
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .poster-result {
          margin-top: 9px;
          padding: 9px 11px;
          border-radius: 16px;
          background: rgba(214, 178, 94, 0.1);
          border: 1px solid rgba(214, 178, 94, 0.2);
          display: grid;
          gap: 2px;
        }

        .poster-result strong {
          color: #ffffff;
          font-size: 15px;
        }

        .poster-result small {
          color: rgba(226, 232, 240, 0.67);
          font-size: 13px;
        }

        .pm-qf1 { left: 0; top: 40px; }
        .pm-qf2 { left: 0; top: 360px; }

        .pm-qf3 { right: 0; top: 40px; }
        .pm-qf4 { right: 0; top: 360px; }

        .pm-sf1 { left: 450px; top: 200px; width: 360px; }
        .pm-sf2 { right: 450px; top: 200px; width: 360px; }

        .pm-final { left: 928px; top: 520px; width: 400px; }

        .poster-champion {
          position: absolute;
          z-index: 5;
          left: 948px;
          top: 118px;
          width: 360px;
          min-height: 340px;
          padding: 32px 26px;
          box-sizing: border-box;
          border-radius: 34px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 8px;
          text-align: center;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 0%, rgba(255, 232, 148, 0.28), transparent 58%),
            linear-gradient(180deg, rgba(26, 41, 48, 0.95), rgba(10, 23, 26, 0.98));
          border: 1px solid rgba(214, 178, 94, 0.58);
          box-shadow:
            0 24px 54px rgba(0, 0, 0, 0.34),
            0 0 0 1px rgba(255, 227, 145, 0.08) inset,
            0 0 48px rgba(214, 178, 94, 0.16);
        }

        .poster-champion::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(
              135deg,
              rgba(255, 240, 180, 0.12) 0%,
              rgba(255, 240, 180, 0.03) 34%,
              rgba(255, 240, 180, 0.00) 100%
            );
        }

        .poster-champion.is-played {
          background:
            radial-gradient(circle at 50% 0%, rgba(255, 230, 125, 0.38), transparent 60%),
            linear-gradient(180deg, rgba(31, 46, 52, 0.98), rgba(10, 23, 26, 1));
          border-color: rgba(239, 198, 92, 0.9);
          box-shadow:
            0 26px 58px rgba(0, 0, 0, 0.36),
            0 0 0 1px rgba(255, 231, 154, 0.16) inset,
            0 0 70px rgba(214, 178, 94, 0.22);
        }

        .poster-trophy-wrap {
          position: relative;
          width: 142px;
          height: 142px;
          display: grid;
          place-items: center;
          margin: 4px 0 6px;
        }

        .poster-trophy-ring {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background:
            radial-gradient(circle, rgba(255, 232, 148, 0.24), rgba(255, 232, 148, 0.03) 68%, transparent 72%);
          border: 1px solid rgba(255, 232, 148, 0.18);
          box-shadow: 0 0 42px rgba(214, 178, 94, 0.18);
        }

        .poster-trophy {
          position: relative;
          z-index: 2;
          width: 102px;
          height: 102px;
          display: grid;
          place-items: center;
          border-radius: 26px;
          background:
            linear-gradient(180deg, rgba(255, 245, 200, 0.09), rgba(255, 218, 115, 0.05)),
            rgba(7, 17, 19, 0.32);
          border: 1px solid rgba(255, 232, 148, 0.16);
          box-shadow:
            0 16px 30px rgba(0, 0, 0, 0.20),
            0 0 30px rgba(214, 178, 94, 0.12);
        }

        .poster-trophy svg {
          width: 78px;
          height: 78px;
          display: block;
          filter: drop-shadow(0 8px 14px rgba(214, 178, 94, 0.26));
        }

        .poster-champion strong {
          position: relative;
          z-index: 2;
          color: #ffffff;
          font-size: 34px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          max-width: 100%;
        }

        .poster-champion small {
          position: relative;
          z-index: 2;
          color: rgba(226, 232, 240, 0.76);
          font-size: 15px;
          line-height: 1.35;
        }

        .poster-champion em {
          position: relative;
          z-index: 2;
          margin-top: 4px;
          font-style: normal;
          font-size: 13px;
          font-weight: 850;
          color: #f5deb3;
          background: rgba(214, 178, 94, 0.10);
          border: 1px solid rgba(214, 178, 94, 0.18);
          padding: 7px 12px;
          border-radius: 999px;
        }

        .poster-line {
          position: absolute;
          z-index: 1;
          background: rgba(214, 178, 94, 0.55);
          box-shadow: 0 0 14px rgba(214, 178, 94, 0.12);
          border-radius: 999px;
          pointer-events: none;
        }

        .poster-line.h {
          height: 2px;
        }

        .poster-line.v {
          width: 2px;
        }

        /* izquierda */
        .l-qf1 { left: 390px; top: 150px; width: 60px; }
        .l-qf2 { left: 390px; top: 470px; width: 60px; }
        .l-qf-left-v { left: 450px; top: 150px; height: 320px; }
        .l-qf-left-mid { left: 450px; top: 310px; width: 80px; }

        /* derecha */
        .l-qf3 { left: 1806px; top: 150px; width: 60px; }
        .l-qf4 { left: 1806px; top: 470px; width: 60px; }
        .l-qf-right-v { left: 1806px; top: 150px; height: 320px; }
        .l-qf-right-mid { left: 1726px; top: 310px; width: 80px; }

        /* hacia final */
        .l-sf1-final { left: 810px; top: 310px; width: 118px; }
        .l-sf2-final { left: 1328px; top: 310px; width: 122px; }
        .l-final-champion { left: 1128px; top: 458px; width: 2px; height: 62px; }

        .poster-footer {
          position: absolute;
          left: 72px;
          right: 72px;
          bottom: 42px;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 14px;
          color: rgba(226, 232, 240, 0.72);
        }

        .poster-footer strong {
          color: #ffffff;
          font-size: 18px;
        }

        .poster-footer small {
          margin-left: auto;
          color: rgba(203, 213, 225, 0.58);
          font-size: 15px;
        }

        .share-error {
          max-width: 720px;
          margin: 80px auto;
          padding: 32px;
          border-radius: 26px;
          background: rgba(13, 27, 30, 0.96);
          border: 1px solid rgba(226, 232, 240, 0.12);
        }

        .share-error span {
          text-transform: uppercase;
          letter-spacing: 0.13em;
          font-size: 0.72rem;
          font-weight: 900;
          color: #d6b25e;
        }

        .share-error p {
          color: rgba(226, 232, 240, 0.72);
        }

        @media (max-width: 900px) {
          .share-page {
            padding: 16px;
          }

          .share-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .share-toolbar button {
            width: 100%;
          }

          .share-top-actions {
            justify-content: stretch;
          }

          .share-top-actions a {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
