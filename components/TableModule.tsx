"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TablePlayer } from "../types/table-player";

type TableModuleProps = {
  standings: TablePlayer[];
  totalMatches: number;
  totalPlayers: number;
  totalPoints: number;
};

function getPositionCardStyles(position: number) {
  if (position === 1) {
    return "border-yellow-300 bg-[linear-gradient(180deg,#fff9db_0%,#ffffff_100%)]";
  }

  if (position === 2) {
    return "border-slate-300 bg-[linear-gradient(180deg,#f1f5f9_0%,#ffffff_100%)]";
  }

  if (position === 3) {
    return "border-amber-300 bg-[linear-gradient(180deg,#fff4e6_0%,#ffffff_100%)]";
  }

  return "border-slate-200 bg-white";
}

function getPositionBadge(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
}

function getPositionRing(position: number) {
  if (position === 1) return "ring-yellow-200";
  if (position === 2) return "ring-slate-200";
  if (position === 3) return "ring-amber-200";
  return "ring-slate-200";
}

function getStreakStyles(streak: string) {
  if (streak.startsWith("W")) {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }

  if (streak.startsWith("L")) {
    return "bg-red-100 text-red-700 border border-red-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function getPointsPill(position: number) {
  if (position === 1) return "bg-yellow-400 text-slate-900";
  if (position === 2) return "bg-slate-800 text-white";
  if (position === 3) return "bg-amber-500 text-white";
  return "bg-slate-900 text-white";
}

function getFormDot(result: string) {
  return result === "W"
    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
    : "bg-red-100 text-red-700 border border-red-200";
}

export default function TableModule({
  standings,
  totalMatches,
  totalPlayers,
  totalPoints,
}: TableModuleProps) {
  const [search, setSearch] = useState("");

  const filteredStandings = useMemo(() => {
    return standings.filter((player) =>
      player.player_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [standings, search]);

  const podiumOrder = [standings[1], standings[0], standings[2]].filter(Boolean);
  const leader = standings[0];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_28%,#f8fafc_100%)] text-slate-900">
      <div className="mobile-safe-x mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.14),transparent_24%)]" />
          <div className="relative">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-700">
                  Ranking oficial
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Tabla general de la escalerilla
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Sigue la clasificación actual, revisa el podio, analiza rachas y
                  consulta el rendimiento reciente de cada jugador de una forma más
                  clara y visual.
                </p>
              </div>

              {leader && (
                <div className="tennis-hero-card max-w-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                    Líder actual
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="table-photo-shell h-16 w-16 flex-[0_0_64px] rounded-2xl ring-4 ring-yellow-100">
                      {leader.photo_url ? (
                        <img
                          src={leader.photo_url}
                          alt={leader.player_name}
                          className="table-photo-img"
                        />
                      ) : (
                        <div className="photo-fallback">Sin foto</div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-slate-950">
                        {leader.player_name}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {leader.points} pts · {leader.wins} victorias
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-slate-900">
                      #{1}
                    </span>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                      DG{" "}
                      {leader.game_difference > 0
                        ? `+${leader.game_difference}`
                        : leader.game_difference}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getStreakStyles(
                        leader.streak
                      )}`}
                    >
                      {leader.streak}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="tennis-stat-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Jugadores
                    </p>
                    <p className="mt-3 text-3xl font-black text-slate-950">
                      {totalPlayers}
                    </p>
                  </div>
                  <span className="text-3xl">🎾</span>
                </div>
              </div>

              <div className="tennis-stat-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Partidos
                    </p>
                    <p className="mt-3 text-3xl font-black text-slate-950">
                      {totalMatches}
                    </p>
                  </div>
                  <span className="text-3xl">📋</span>
                </div>
              </div>

              <div className="tennis-stat-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Puntos repartidos
                    </p>
                    <p className="mt-3 text-3xl font-black text-slate-950">
                      {totalPoints}
                    </p>
                  </div>
                  <span className="text-3xl">🏆</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                Destacados
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Podio actual
              </h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3 md:items-end">
            {podiumOrder.map((player) => {
              const position =
                standings.findIndex((p) => p.player_id === player.player_id) + 1;

              const isFirst = position === 1;

              return (
                <article
                  key={player.player_id}
                  className={`group relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_14px_40px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)] ${
                    isFirst ? "md:-translate-y-4" : ""
                  } ${getPositionCardStyles(position)}`}
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300" />

                  <div className="relative text-center">
                    <div
                      className={`podium-photo-shell mx-auto ring-4 ${getPositionRing(position)} ${
                        isFirst ? "h-36 w-36 md:h-40 md:w-40" : "h-30 w-30 md:h-34 md:w-34"
                      }`}
                    >
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.player_name}
                          className="podium-photo-img"
                        />
                      ) : (
                        <div className="photo-fallback">Sin foto</div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2">
                      <span className="text-3xl">{getPositionBadge(position)}</span>
                      <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                        Posición {position}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black text-slate-950">
                      <Link
                        href={`/jugadores/${player.player_id}`}
                        className="transition hover:text-cyan-700"
                      >
                        {player.player_name}
                      </Link>
                    </h3>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span
                        className={`rounded-full px-4 py-1.5 text-sm font-black shadow-sm ${getPointsPill(
                          position
                        )}`}
                      >
                        {player.points} pts
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700">
                        DG{" "}
                        {player.game_difference > 0
                          ? `+${player.game_difference}`
                          : player.game_difference}
                      </span>
                    </div>

                    <div className="mt-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStreakStyles(
                          player.streak
                        )}`}
                      >
                        Racha {player.streak}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.9),rgba(255,255,255,0.95))] p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                  Clasificación
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                  Tabla general
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ordenada por puntos, diferencia de juegos, juegos a favor,
                  diferencia de sets, victorias y nombre.
                </p>
              </div>

              <div className="w-full max-w-sm">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Buscar jugador
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    🔎
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Escribe un nombre"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-11 py-3 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1120px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700">
                  <th className="px-4 py-4 text-left">Pos.</th>
                  <th className="px-4 py-4 text-left">Jugador</th>
                  <th className="px-4 py-4 text-center">PJ</th>
                  <th className="px-4 py-4 text-center">PG</th>
                  <th className="px-4 py-4 text-center">PP</th>
                  <th className="px-4 py-4 text-center">Pts</th>
                  <th className="px-4 py-4 text-center">DG</th>
                  <th className="px-4 py-4 text-center">JF</th>
                  <th className="px-4 py-4 text-center">JC</th>
                  <th className="px-4 py-4 text-center">DS</th>
                  <th className="px-4 py-4 text-center">Racha</th>
                  <th className="px-4 py-4 text-center">Últimos</th>
                </tr>
              </thead>

              <tbody>
                {filteredStandings.map((row) => {
                  const realPosition =
                    standings.findIndex((p) => p.player_id === row.player_id) + 1;

                  const isTopThree = realPosition <= 3;

                  return (
                    <tr
                      key={row.player_id}
                      className={`border-b border-slate-100 transition hover:bg-cyan-50/40 ${
                        isTopThree ? "bg-slate-50/60" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-4 font-semibold">
                        <span
                          className={`inline-flex min-w-11 items-center justify-center rounded-full px-3 py-1 text-xs font-black shadow-sm ${
                            realPosition === 1
                              ? "bg-yellow-400 text-slate-900"
                              : realPosition === 2
                              ? "bg-slate-800 text-white"
                              : realPosition === 3
                              ? "bg-amber-500 text-white"
                              : "bg-slate-900 text-white"
                          }`}
                        >
                          {realPosition}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`table-photo-shell ring-2 ${
                              isTopThree ? getPositionRing(realPosition) : "ring-transparent"
                            }`}
                          >
                            {row.photo_url ? (
                              <img
                                src={row.photo_url}
                                alt={row.player_name}
                                className="table-photo-img"
                              />
                            ) : (
                              <div className="photo-fallback" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <Link
                              href={`/jugadores/${row.player_id}`}
                              className="block truncate font-black text-slate-950 transition hover:text-cyan-700"
                            >
                              {row.player_name}
                            </Link>

                            <div className="mt-1 flex items-center gap-2">
                              {isTopThree && (
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                                  Top 3
                                </span>
                              )}
                              <span className="text-xs text-slate-500">
                                {row.wins}V · {row.losses}D
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center font-semibold">{row.played}</td>
                      <td className="px-4 py-4 text-center font-semibold text-emerald-700">
                        {row.wins}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-orange-700">
                        {row.losses}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1.5 text-sm font-black shadow-sm ${getPointsPill(
                            realPosition
                          )}`}
                        >
                          {row.points}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-black">
                        {row.game_difference > 0 ? `+${row.game_difference}` : row.game_difference}
                      </td>
                      <td className="px-4 py-4 text-center">{row.games_won}</td>
                      <td className="px-4 py-4 text-center">{row.games_lost}</td>
                      <td className="px-4 py-4 text-center font-black">
                        {row.set_difference > 0 ? `+${row.set_difference}` : row.set_difference}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStreakStyles(
                            row.streak
                          )}`}
                        >
                          {row.streak}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          {row.last_results.length > 0 ? (
                            row.last_results.map((result, idx) => (
                              <span
                                key={`${row.player_id}-${idx}`}
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black shadow-sm ${getFormDot(
                                  result
                                )}`}
                              >
                                {result}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredStandings.length === 0 && (
              <div className="py-14 text-center text-slate-500">
                No hay jugadores que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}