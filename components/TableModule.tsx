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

function getPositionStyles(position: number) {
  if (position === 1) return "border-yellow-300 bg-yellow-50";
  if (position === 2) return "border-slate-300 bg-slate-100";
  if (position === 3) return "border-amber-300 bg-amber-50";
  return "border-slate-200 bg-white";
}

function getPositionBadge(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
}

function getStreakStyles(streak: string) {
  if (streak.startsWith("W")) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (streak.startsWith("L")) {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mobile-safe-x mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Jugadores
            </p>
            <p className="mt-2 text-2xl font-black">{totalPlayers}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Partidos
            </p>
            <p className="mt-2 text-2xl font-black">{totalMatches}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Puntos repartidos
            </p>
            <p className="mt-2 text-2xl font-black">{totalPoints}</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-black tracking-tight sm:text-3xl">Podio</h2>

          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            {podiumOrder.map((player) => {
              const position =
                standings.findIndex((p) => p.player_id === player.player_id) + 1;

              const isFirst = position === 1;

              return (
                <article
                  key={player.player_id}
                  className={`rounded-3xl border p-5 shadow-sm transition ${
                    isFirst ? "md:scale-105" : "md:scale-95"
                  } ${getPositionStyles(position)}`}
                >
                  <div className="text-center">
                    <div
                      className={`mx-auto flex items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow ${
                        isFirst ? "h-24 w-24 sm:h-28 sm:w-28" : "h-20 w-20 sm:h-24 sm:w-24"
                      }`}
                    >
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.player_name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                          Sin foto
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-3xl">{getPositionBadge(position)}</p>

                    <h3 className="mt-2 text-lg font-bold sm:text-xl">
                      <Link href={`/jugadores/${player.player_id}`}>
                        {player.player_name}
                      </Link>
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">{player.points} pts</p>

                    <div className="mt-2 text-xs font-semibold text-slate-600">
                      DG {player.game_difference > 0 ? `+${player.game_difference}` : player.game_difference}
                    </div>

                    <div className="mt-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStreakStyles(
                          player.streak
                        )}`}
                      >
                        {player.streak}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black sm:text-2xl">Clasificación general</h2>
              <p className="mt-1 text-sm text-slate-600">
                Ordenada por puntos, diferencia de juegos, juegos a favor, diferencia de sets, victorias y nombre.
              </p>
            </div>

            <div className="w-full lg:max-w-xs">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar jugador
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Escribe un nombre"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-500"
              />
            </div>
          </div>

          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="min-w-full overflow-hidden text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
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

                  return (
                    <tr
                      key={row.player_id}
                      className="border-b border-slate-100 bg-white transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-semibold">
                        <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                          {realPosition}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                            {row.photo_url ? (
                              <img
                                src={row.photo_url}
                                alt={row.player_name}
                                className="h-full w-full object-contain"
                              />
                            ) : null}
                          </div>

                          <div>
                            <Link
                              href={`/jugadores/${row.player_id}`}
                              className="font-semibold text-slate-900 hover:underline"
                            >
                              {row.player_name}
                            </Link>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">{row.played}</td>
                      <td className="px-4 py-4 text-center">{row.wins}</td>
                      <td className="px-4 py-4 text-center">{row.losses}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white">
                          {row.points}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold">
                        {row.game_difference > 0 ? `+${row.game_difference}` : row.game_difference}
                      </td>
                      <td className="px-4 py-4 text-center">{row.games_won}</td>
                      <td className="px-4 py-4 text-center">{row.games_lost}</td>
                      <td className="px-4 py-4 text-center font-semibold">
                        {row.set_difference > 0 ? `+${row.set_difference}` : row.set_difference}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStreakStyles(
                            row.streak
                          )}`}
                        >
                          {row.streak}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          {row.last_results.length > 0 ? (
                            row.last_results.map((result, idx) => (
                              <span
                                key={`${row.player_id}-${idx}`}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                                  result === "W"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
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
              <div className="py-10 text-center text-slate-500">
                No hay jugadores que coincidan con la búsqueda.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 md:hidden">
            {filteredStandings.map((row) => {
              const realPosition =
                standings.findIndex((p) => p.player_id === row.player_id) + 1;

              return (
                <article
                  key={row.player_id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                      {realPosition}
                    </span>

                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                        {row.photo_url ? (
                          <img
                            src={row.photo_url}
                            alt={row.player_name}
                            className="h-full w-full object-contain"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/jugadores/${row.player_id}`}
                          className="block truncate font-bold text-slate-900"
                        >
                          {row.player_name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                            {row.points} pts
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            DG {row.game_difference > 0 ? `+${row.game_difference}` : row.game_difference}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStreakStyles(
                              row.streak
                            )}`}
                          >
                            {row.streak}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-[11px] font-bold uppercase text-slate-500">PJ</div>
                      <div className="mt-1 text-sm font-black">{row.played}</div>
                    </div>
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-[11px] font-bold uppercase text-slate-500">PG</div>
                      <div className="mt-1 text-sm font-black">{row.wins}</div>
                    </div>
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-[11px] font-bold uppercase text-slate-500">PP</div>
                      <div className="mt-1 text-sm font-black">{row.losses}</div>
                    </div>
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-[11px] font-bold uppercase text-slate-500">DS</div>
                      <div className="mt-1 text-sm font-black">
                        {row.set_difference > 0 ? `+${row.set_difference}` : row.set_difference}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-[11px] font-bold uppercase text-slate-500">JF</div>
                      <div className="mt-1 text-sm font-black">{row.games_won}</div>
                    </div>
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-[11px] font-bold uppercase text-slate-500">JC</div>
                      <div className="mt-1 text-sm font-black">{row.games_lost}</div>
                    </div>
                    <div className="rounded-xl bg-white p-2">
                      <div className="text-[11px] font-bold uppercase text-slate-500">Últimos</div>
                      <div className="mt-1 flex justify-center gap-1">
                        {row.last_results.length > 0 ? (
                          row.last_results.slice(0, 3).map((result, idx) => (
                            <span
                              key={`${row.player_id}-${idx}`}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                                result === "W"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {result}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredStandings.length === 0 && (
              <div className="py-10 text-center text-slate-500">
                No hay jugadores que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}