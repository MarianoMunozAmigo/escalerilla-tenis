export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { supabase } from "../../lib/supabase";
import type { Player } from "../../types/player";
import ModuleHero from "../../components/ModuleHero";

export default async function JugadoresPage() {
  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true });

  const safePlayers: Player[] = players ?? [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mobile-safe-x mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <ModuleHero
          title="Jugadores"
          description="Perfil deportivo de cada participante, con acceso a su ficha individual, estadísticas y estilo de juego."
        />

        {error && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error al cargar jugadores: {error.message}
          </p>
        )}

        {!error && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {safePlayers.map((player) => (
              <Link
                key={player.id}
                href={`/jugadores/${player.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative flex h-72 items-center justify-center overflow-hidden bg-gradient-to-b from-cyan-50 via-white to-orange-50 p-6">
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="max-h-full max-w-full rounded-[1.5rem] object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500">
                      Sin fotografía
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent px-5 pb-5 pt-12">
                    <h2 className="text-xl font-black text-white sm:text-2xl">
                      {player.name}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                      {player.handedness || "Mano no registrada"}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        player.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {player.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Descripción
                      </h3>
                      <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-700">
                        {player.short_description || "Sin descripción breve registrada."}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Estilo de juego
                      </h3>
                      <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-700">
                        {player.play_style || "Sin estilo de juego registrado."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center text-sm font-black text-slate-900">
                      Ver perfil completo
                      <span className="ml-2 transition group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}