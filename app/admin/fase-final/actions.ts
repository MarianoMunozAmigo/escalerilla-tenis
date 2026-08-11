"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../../../lib/supabase";
import { FINAL_MATCH_SEED_ROWS } from "../../../lib/finalBracket";

export async function inicializarFaseFinal() {
  const { error } = await supabase
    .from("final_matches")
    .upsert(FINAL_MATCH_SEED_ROWS, {
      onConflict: "match_key",
    });

  if (error) {
    throw new Error(`No se pudo inicializar la fase final: ${error.message}`);
  }

  revalidatePath("/admin/fase-final");
  revalidatePath("/fase-final");
}

export async function reportarResultadoFaseFinal(formData: FormData) {
  const matchKey = String(formData.get("match_key") ?? "");
  const winnerPlayerId = String(formData.get("winner_player_id") ?? "");
  const scoreText = String(formData.get("score_text") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!matchKey) {
    throw new Error("No se recibió el identificador del partido.");
  }

  if (!winnerPlayerId) {
    throw new Error("Debes seleccionar un ganador.");
  }

  const { error } = await supabase
    .from("final_matches")
    .update({
      winner_player_id: winnerPlayerId,
      score_text: scoreText || null,
      notes: notes || null,
      status: "played",
      played_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("match_key", matchKey);

  if (error) {
    throw new Error(`No se pudo guardar el resultado: ${error.message}`);
  }

  revalidatePath("/admin/fase-final");
  revalidatePath("/fase-final");
}

export async function limpiarResultadoFaseFinal(formData: FormData) {
  const matchKey = String(formData.get("match_key") ?? "");

  if (!matchKey) {
    throw new Error("No se recibió el identificador del partido.");
  }

  const { error } = await supabase
    .from("final_matches")
    .update({
      winner_player_id: null,
      score_text: null,
      notes: null,
      status: "pending",
      played_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("match_key", matchKey);

  if (error) {
    throw new Error(`No se pudo limpiar el resultado: ${error.message}`);
  }

  revalidatePath("/admin/fase-final");
  revalidatePath("/fase-final");
  }