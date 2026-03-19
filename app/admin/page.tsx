export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import type { Player } from "../../types/player";
import type { Match } from "../../types/match";
import { createMatch, deleteMatch } from "./actions";
import ModuleHero from "../../components/ModuleHero";
import AdminMatchForm from "../../components/AdminMatchForm";
import DeleteMatchButton from "../../components/DeleteMatchButton";
import { logoutAction } from "../login/actions";

type AdminPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const successMessage = params?.success ?? "";
  const errorMessage = params?.error ?? "";

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false })
    .order("id", { ascending: false });

  const safePlayers: Player[] = players ?? [];
  const safeMatches: Match[] = matches ?? [];

  const playerMap = new Map<number, string>();
  safePlayers.forEach((player) => {
    playerMap.set(player.id, player.name);
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <ModuleHero
          title="Administración"
          description="Panel de registro y gestión de resultados de la escalerilla."
        />
        <div className="mt-6 flex justify-end">
  <form action={logoutAction}>
    <button
      type="submit"
      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100"
    >
      Cerrar sesión
    </button>
  </form>
</div>

        {successMessage && (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            {successMessage}
          </p>
        )}

        {errorMessage && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </p>
        )}

        {playersError && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error al cargar jugadores: {playersError.message}
          </p>
        )}

        {!playersError && (
          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Registrar partido</h2>
            <p className="mt-1 text-slate-600">
              Ingresa aquí el resultado oficial de un encuentro.
            </p>

            <AdminMatchForm players={safePlayers} action={createMatch} />
          </div>
        )}

        {!matchesError && (
          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-black">Partidos registrados</h2>
              <p className="mt-1 text-slate-600">
                Desde aquí puedes revisar, editar y eliminar partidos cargados.
              </p>
            </div>

            {safeMatches.length === 0 ? (
              <p className="text-slate-600">No hay partidos registrados.</p>
            ) : (
              <div className="space-y-4">
                {safeMatches.map((match) => (
                  <article
                    key={match.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-lg font-black">
                          {playerMap.get(match.winner_id) ?? `Jugador ${match.winner_id}`} venció a{" "}
                          {playerMap.get(match.loser_id) ?? `Jugador ${match.loser_id}`}
                        </h3>

                        <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                          <p>Marcador: {match.score_text}</p>
                          <p>Fecha: {match.match_date}</p>
                          <p>Super tie break: {match.super_tiebreak ? "Sí" : "No"}</p>
                          <p>
                            Puntos: {match.winner_points} - {match.loser_points}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/admin/partidos/${match.id}`}
                          className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
                        >
                          Editar partido
                        </Link>

                        <form action={deleteMatch}>
                          <input type="hidden" name="match_id" value={match.id} />
                          <DeleteMatchButton />
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {matchesError && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error al cargar partidos: {matchesError.message}
          </p>
        )}
      </div>
    </main>
  );
}
