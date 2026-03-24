export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { supabase } from "../../lib/supabase";
import type { Player } from "../../types/player";

function parseStrengths(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export default async function JugadoresPage() {
  const { data: players, error } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true });

  const safePlayers: Player[] = players ?? [];
  const activePlayers = safePlayers.filter((player) => player.active).length;
  const completedProfiles = safePlayers.filter(
    (player) => player.short_description || player.play_style || player.strengths
  ).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_28%,#f8fafc_100%)] text-slate-900">
      <div className="mobile-safe-x mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.14),transparent_24%)]" />
          <div className="relative">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-700">
                  Perfiles deportivos
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Jugadores de la escalerilla
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Revisa la ficha de cada participante, conoce su estilo de juego,
                  fortalezas y accede a su historial completo dentro de la competencia.
                </p>
              </div>

              <div className="tennis-hero-card max-w-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                  Vista general
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <p className="text-xs font-bold text-slate-500">Total</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">
                      {safePlayers.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <p className="text-xs font-bold text-slate-500">Activos</p>
                    <p className="mt-1 text-2xl font-black text-emerald-600">
                      {activePlayers}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <p className="text-xs font-bold text-slate-500">Fichas</p>
                    <p className="mt-1 text-2xl font-black text-cyan-700">
                      {completedProfiles}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                Error al cargar jugadores: {error.message}
              </p>
            )}
          </div>
        </section>

        {!error && (
          <section className="mt-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                  Directorio
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Perfiles disponibles
                </h2>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {safePlayers.map((player) => {
                const strengths = parseStrengths(player.strengths);

                return (
                  <Link
                    key={player.id}
                    href={`/jugadores/${player.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]"
                  >
                    <div className="relative flex h-72 items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(236,254,255,0.8),rgba(255,255,255,1),rgba(254,249,195,0.55))] p-6">
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.name}
                          className="player-card-photo"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500">
                          Sin fotografía
                        </div>
                      )}

                      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300" />

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent px-5 pb-5 pt-12">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-black text-white backdrop-blur">
                            {player.handedness || "Mano no registrada"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-black backdrop-blur ${
                              player.active
                                ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
                                : "border-white/20 bg-white/10 text-white/85"
                            }`}
                          >
                            {player.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <h2 className="mt-3 text-xl font-black text-white sm:text-2xl">
                          {player.name}
                        </h2>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Descripción
                          </h3>
                          <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-700">
                            {player.short_description ||
                              "Sin descripción breve registrada."}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Estilo de juego
                          </h3>
                          <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-700">
                            {player.play_style || "Sin estilo de juego registrado."}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                            Fortalezas
                          </h3>

                          {strengths.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {strengths.map((strength) => (
                                <span
                                  key={`${player.id}-${strength}`}
                                  className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800"
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500">
                              Sin fortalezas registradas.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 border-t border-slate-100 pt-4">
                        <span className="inline-flex items-center text-sm font-black text-slate-950">
                          Ver perfil completo
                          <span className="ml-2 transition group-hover:translate-x-1">
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}