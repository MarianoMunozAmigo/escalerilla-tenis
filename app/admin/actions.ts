"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "../../lib/supabase-admin";

export async function createMatch(formData: FormData) {
  const player1Id = Number(formData.get("player_1_id"));
  const player2Id = Number(formData.get("player_2_id"));
  const winnerId = Number(formData.get("winner_id"));
  const scoreText = String(formData.get("score_text") || "").trim();
  const matchDate = String(formData.get("match_date") || "").trim();
  const superTiebreak = formData.get("super_tiebreak") === "on";

  if (!player1Id || !player2Id || !winnerId || !scoreText || !matchDate) {
    redirect("/admin?error=Todos+los+campos+obligatorios+deben+completarse");
  }

  if (player1Id === player2Id) {
    redirect("/admin?error=Un+jugador+no+puede+enfrentarse+a+si+mismo");
  }

  if (winnerId !== player1Id && winnerId !== player2Id) {
    redirect("/admin?error=El+ganador+debe+ser+uno+de+los+dos+jugadores+seleccionados");
  }

  const loserId = winnerId === player1Id ? player2Id : player1Id;
  const loserPoints = superTiebreak ? 1 : 0;

  const { data: existingMatches, error: existingError } = await supabaseAdmin
    .from("matches")
    .select("id")
    .or(
      `and(player_1_id.eq.${player1Id},player_2_id.eq.${player2Id}),and(player_1_id.eq.${player2Id},player_2_id.eq.${player1Id})`
    );

  if (existingError) {
    redirect("/admin?error=No+fue+posible+validar+los+enfrentamientos+existentes");
  }

  const matchesPlayed = existingMatches?.length ?? 0;

  if (matchesPlayed >= 2) {
    redirect("/admin?error=Esta+pareja+de+jugadores+ya+completo+sus+2+enfrentamientos+permitidos");
  }

  const { error: insertError } = await supabaseAdmin.from("matches").insert({
    player_1_id: player1Id,
    player_2_id: player2Id,
    winner_id: winnerId,
    loser_id: loserId,
    score_text: scoreText,
    super_tiebreak: superTiebreak,
    winner_points: 3,
    loser_points: loserPoints,
    match_date: matchDate,
  });

  if (insertError) {
    redirect(`/admin?error=No+se+pudo+guardar+el+partido:+${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath("/partidos");
  revalidatePath("/enfrentamientos");
  revalidatePath("/jugadores");
  revalidatePath(`/jugadores/${player1Id}`);
  revalidatePath(`/jugadores/${player2Id}`);
  revalidatePath("/admin");

  redirect("/admin?success=Partido+registrado+correctamente");
}

export async function updateMatch(formData: FormData) {
  const matchId = Number(formData.get("match_id"));
  const player1Id = Number(formData.get("player_1_id"));
  const player2Id = Number(formData.get("player_2_id"));
  const winnerId = Number(formData.get("winner_id"));
  const scoreText = String(formData.get("score_text") || "").trim();
  const matchDate = String(formData.get("match_date") || "").trim();
  const superTiebreak = formData.get("super_tiebreak") === "on";

  if (!matchId || Number.isNaN(matchId)) {
    redirect("/admin?error=No+se+pudo+identificar+el+partido");
  }

  const { data: currentMatch } = await supabaseAdmin
    .from("matches")
    .select("player_1_id, player_2_id")
    .eq("id", matchId)
    .single();

  if (!player1Id || !player2Id || !winnerId || !scoreText || !matchDate) {
    redirect(`/admin/partidos/${matchId}?error=Todos+los+campos+obligatorios+deben+completarse`);
  }

  if (player1Id === player2Id) {
    redirect(`/admin/partidos/${matchId}?error=Un+jugador+no+puede+enfrentarse+a+si+mismo`);
  }

  if (winnerId !== player1Id && winnerId !== player2Id) {
    redirect(`/admin/partidos/${matchId}?error=El+ganador+debe+ser+uno+de+los+dos+jugadores+seleccionados`);
  }

  const loserId = winnerId === player1Id ? player2Id : player1Id;
  const loserPoints = superTiebreak ? 1 : 0;

  const { data: existingMatches, error: existingError } = await supabaseAdmin
    .from("matches")
    .select("id")
    .neq("id", matchId)
    .or(
      `and(player_1_id.eq.${player1Id},player_2_id.eq.${player2Id}),and(player_1_id.eq.${player2Id},player_2_id.eq.${player1Id})`
    );

  if (existingError) {
    redirect(`/admin/partidos/${matchId}?error=No+fue+posible+validar+los+enfrentamientos+existentes`);
  }

  const matchesPlayed = existingMatches?.length ?? 0;

  if (matchesPlayed >= 2) {
    redirect(`/admin/partidos/${matchId}?error=Esta+pareja+de+jugadores+ya+completo+sus+2+enfrentamientos+permitidos`);
  }

  const { error: updateError } = await supabaseAdmin
    .from("matches")
    .update({
      player_1_id: player1Id,
      player_2_id: player2Id,
      winner_id: winnerId,
      loser_id: loserId,
      score_text: scoreText,
      super_tiebreak: superTiebreak,
      winner_points: 3,
      loser_points: loserPoints,
      match_date: matchDate,
    })
    .eq("id", matchId);

  if (updateError) {
    redirect(`/admin/partidos/${matchId}?error=No+se+pudo+actualizar+el+partido:+${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath("/partidos");
  revalidatePath("/enfrentamientos");
  revalidatePath("/jugadores");
  revalidatePath(`/jugadores/${player1Id}`);
  revalidatePath(`/jugadores/${player2Id}`);

  if (currentMatch) {
    revalidatePath(`/jugadores/${currentMatch.player_1_id}`);
    revalidatePath(`/jugadores/${currentMatch.player_2_id}`);
  }

  revalidatePath("/admin");
  redirect("/admin?success=Partido+actualizado+correctamente");
}

export async function deleteMatch(formData: FormData) {
  const matchId = Number(formData.get("match_id"));

  if (!matchId || Number.isNaN(matchId)) {
    redirect("/admin?error=No+se+pudo+identificar+el+partido+a+eliminar");
  }

  const { data: currentMatch } = await supabaseAdmin
    .from("matches")
    .select("player_1_id, player_2_id")
    .eq("id", matchId)
    .single();

  const { error } = await supabaseAdmin
    .from("matches")
    .delete()
    .eq("id", matchId);

  if (error) {
    redirect(`/admin?error=No+se+pudo+eliminar+el+partido:+${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/tabla");
  revalidatePath("/partidos");
  revalidatePath("/enfrentamientos");
  revalidatePath("/jugadores");
  revalidatePath("/admin");

  if (currentMatch) {
    revalidatePath(`/jugadores/${currentMatch.player_1_id}`);
    revalidatePath(`/jugadores/${currentMatch.player_2_id}`);
  }

  revalidatePath("/admin");

  redirect("/admin?success=Partido+eliminado+correctamente");
}
