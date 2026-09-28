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

  const rows: Array<{
    playerA: Player;
    playerB: Player;
    played: number;
    pending: number;
  }> = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const playerA = players[i];
      const playerB = players[j];
      const played = pairCountMap.get(getPairKey(playerA.id, playerB.id)) ?? 0;
      const pending = Math.max(0, 2 - played);

      rows.push({ playerA, playerB, played, pending });
    }
  }

  const pendingRows = rows.filter((row) => row.pending > 0);
  const completedRows = rows.filter((row) => row.pending === 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
            {activeEdition.name}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Enfrentamientos
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Control de cruces pendientes. Cada pareja puede jugar hasta 2 partidos.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">Jugadores activos</p>
              <p className="mt-1 text-2xl font-black">{players.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">Cruces pendientes</p>
              <p className="mt-1 text-2xl font-black text-amber-600">{pendingRows.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">Cruces completos</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{completedRows.length}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Cruces pendientes</h2>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {pendingRows.length > 0 ? (
              pendingRows.map((row) => (
                <article
                  key={`${row.playerA.id}-${row.playerB.id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="font-black">
                    {row.playerA.name} vs {row.playerB.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Jugados: {row.played} · Pendientes: {row.pending}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-slate-600">No hay cruces pendientes.</p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Registrar resultados</h2>
              <p className="mt-1 text-slate-600">
                Los resultados se registran desde el panel administrativo.
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
