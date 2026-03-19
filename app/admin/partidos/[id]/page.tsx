export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import type { Player } from "../../../../types/player";
import { updateMatch } from "../../actions";
import ModuleHero from "../../../../components/ModuleHero";
import AdminMatchForm from "../../../../components/AdminMatchForm";

type EditMatchPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditMatchPage({
  params,
  searchParams,
}: EditMatchPageProps) {
  const { id } = await params;
  const parsedId = Number(id);

  if (!parsedId || Number.isNaN(parsedId)) {
    notFound();
  }

  const query = await searchParams;
  const errorMessage = query?.error ?? "";

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", parsedId)
    .single();

  if (matchError || !match) {
    notFound();
  }

  const safePlayers: Player[] = players ?? [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            ← Volver a administración
          </Link>
        </div>

        <ModuleHero
          title="Editar partido"
          description="Corrige los datos de un partido registrado sin necesidad de eliminarlo."
        />

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
            <h2 className="text-2xl font-black">Modificar partido</h2>
            <p className="mt-1 text-slate-600">
              Ajusta el marcador o corrige cualquier dato cargado por error.
            </p>

            <AdminMatchForm
              players={safePlayers}
              action={updateMatch}
              submitLabel="Guardar cambios"
              initialValues={{
                match_id: match.id,
                player_1_id: match.player_1_id,
                player_2_id: match.player_2_id,
                winner_id: match.winner_id,
                score_text: match.score_text,
                match_date: match.match_date,
                super_tiebreak: match.super_tiebreak,
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
