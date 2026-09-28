export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getActiveEdition } from "../../lib/editions";
import type { Player } from "../../types/player";
import type { Match } from "../../types/match";

function getPairKey(playerA: number, playerB: number) {
  const min = Math.min(playerA, playerB);
  const max = Math.max(playerA, playerB);

  return `${min}-${max}`;
}

function getStatusConfig(played: number) {
  if (played >= 2) {
    return {
      label: "2/2 · Completo",
      rowClass: "border-orange-200 bg-orange-50/80 text-orange-800",
      badgeClass: "text-orange-700",
    };
  }

  if (played === 1) {
    return {
      label: "1/2 · 1 partido",
      rowClass: "border-yellow-200 bg-yellow-50/80 text-yellow-800",
      badgeClass: "text-yellow-700",
    };
  }

  return {
    label: "0/2 · Disponible",
    rowClass: "border-emerald-200 bg-emerald-50/80 text-emerald-800",
    badgeClass: "text-emerald-700",
  };
}

function getPlayerInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function EnfrentamientosPage() {
  const activeEdition = await getActiveEdition();

  const [
    { data: playersData, error: playersError },
    { data: matchesData, error: matchesError },
  ] = await Promise.all([
    supabase
      .from("players")
      .select("*")
      .eq("edition_id", activeEdition.id)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("matches")
      .select("*")
      .eq("edition_id", activeEdition.id),
  ]);

  if (playersError || matchesError) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error al cargar enfrentamientos: {playersError?.message || matchesError?.message}
          </p>
        </div>
      </main>
    );
  }

  const players: Player[] = playersData ?? [];
  const matches: Match[] = matchesData ?? [];

  const pairCountMap = new Map<string, number>();

  matches.forEach((match) => {
    const key = getPairKey(match.player_1_id, match.player_2_id);
    pairCountMap.set(key, (pairCountMap.get(key) ?? 0) + 1);
  });

  const totalPossiblePairs = (players.length * (players.length - 1)) / 2;
  const completedPairs = Array.from(pairCountMap.values()).filter((played) => played >= 2).length;

  let totalPendingMatches = 0;
  let totalAvailablePairs = 0;

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const played = pairCountMap.get(getPairKey(players[i].id, players[j].id)) ?? 0;
      const pending = Math.max(0, 2 - played);

      totalPendingMatches += pending;

      if (pending > 0) {
        totalAvailablePairs += 1;
      }
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_28%,#f8fafc_100%)] text-slate-900">
      <div className="mobile-safe-x mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.14),transparent_24%)]" />

          <div className="relative">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-700">
                  {activeEdition.name}
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Estado de enfrentamientos
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Revisa el avance de cada jugador contra sus rivales. Cada cruce contempla hasta
                  dos partidos por edición.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs font-bold text-slate-500">Jugadores</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{players.length}</p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                  <p className="text-xs font-bold text-emerald-700">Disponibles</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">
                    {totalAvailablePairs}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4 text-center">
                  <p className="text-xs font-bold text-amber-700">Partidos pendientes</p>
                  <p className="mt-1 text-2xl font-black text-amber-700">
                    {totalPendingMatches}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => {
            const rivals = players
              .filter((rival) => rival.id !== player.id)
              .map((rival) => {
                const played = pairCountMap.get(getPairKey(player.id, rival.id)) ?? 0;

                return {
                  rival,
                  played,
                  status: getStatusConfig(played),
                };
              })
              .sort((a, b) => {
                if (a.played !== b.played) {
                  return a.played - b.played;
                }

                return a.rival.name.localeCompare(b.rival.name);
              });

            const completed = rivals.filter((item) => item.played >= 2).length;
            const withOneMatch = rivals.filter((item) => item.played === 1).length;
            const available = rivals.filter((item) => item.played === 0).length;

            return (
              <article
                key={player.id}
                className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)]"
              >
                <div className="border-b border-slate-100 bg-gradient-to-r from-white via-cyan-50/70 to-emerald-50/70 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-sm font-black text-slate-500">
                        {player.photo_url ? (
                          <img
                            src={player.photo_url}
                            alt={player.name}
                            className="h-full w-full object-cover object-[center_20%]"
                          />
                        ) : (
                          getPlayerInitials(player.name)
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-black text-slate-950">
                          {player.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Estado de sus enfrentamientos
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-xs font-black text-white shadow-sm">
                      {rivals.length} rivales
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] font-bold text-emerald-700">0/2</p>
                      <p className="text-lg font-black text-emerald-700">{available}</p>
                    </div>

                    <div className="rounded-2xl bg-yellow-50 px-3 py-2">
                      <p className="text-[11px] font-bold text-yellow-700">1/2</p>
                      <p className="text-lg font-black text-yellow-700">{withOneMatch}</p>
                    </div>

                    <div className="rounded-2xl bg-orange-50 px-3 py-2">
                      <p className="text-[11px] font-bold text-orange-700">2/2</p>
                      <p className="text-lg font-black text-orange-700">{completed}</p>
                    </div>
                  </div>
                </div>

                <div className="max-h-[620px] space-y-3 overflow-y-auto p-5">
                  {rivals.map(({ rival, played, status }) => (
                    <div
                      key={`${player.id}-${rival.id}`}
                      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${status.rowClass}`}
                    >
                      <Link
                        href={`/jugadores/${rival.id}`}
                        className="min-w-0 truncate text-sm font-black transition hover:underline"
                      >
                        {rival.name}
                      </Link>

                      <span className={`shrink-0 text-right text-sm font-black ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        {players.length === 0 && (
          <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            No hay jugadores activos registrados en la edición activa.
          </section>
        )}

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Registrar resultados</h2>

              <p className="mt-1 text-slate-600">
                Los resultados se registran desde el panel administrativo y actualizan
                automáticamente esta vista.
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800"
            >
              Ir al admin
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
