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
      <div className="mobile-safe-x mx-auto max-w-7xl px-6 py-10">
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
          <h2 className="mb-6 text-3xl font-black tracking-tight">Podio</h2>

          <div className="flex flex-col items-center gap-6 md:flex-row md:items-end md:justify-center">
            {podiumOrder.map((player) => {
              const position =
                standings.findIndex((p) => p.player_id === player.player_id) + 1;

              const isFirst = position === 1;

              return (
                <article
                  key={player.player_id}
                  className={`rounded-3xl border p-6 shadow-sm transition ${
                    isFirst ? "scale-105" : "scale-95"
                  } ${getPositionStyles(position)}`}
                >
                  <div className="text-center">
                    <div
                      className={`podium-photo-shell mx-auto ${
                        isFirst ? "h-32 w-32 md:h-36 md:w-36" : "h-28 w-28 md:h-32 md:w-32"
                      }`}
                    >
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.player_name}
                          className="podium-photo-img"
                        />
                      ) : (
                        <div className="photo-fallback">
                          Sin foto
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-3xl">{getPositionBadge(position)}</p>

                    <h3 className="mt-2 text-xl font-bold">
                      <Link href={`/jugadores/${player.player_id}`}>
                        {player.player_name}
                      </Link>
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      {player.points} pts
                    </p>

                    <div className="mt-2 text-xs font-semibold text-slate-600">
                      DG{" "}
                      {player.game_difference > 0
                        ? `+${player.game_difference}`
                        : player.game_difference}
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

        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">Clasificación general</h2>
              <p className="mt-1 text-slate-600">
                Ordenada por puntos, diferencia de juegos, juegos a favor, diferencia de sets, victorias y nombre.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar jugador
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Escribe un nombre"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-slate-500"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-[1100px] overflow-hidden text-sm">
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
                          <div className="table-photo-shell">
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
        </section>
      </div>
    </main>
  );
}