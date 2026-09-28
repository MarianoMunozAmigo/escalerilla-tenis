import { supabase } from "./supabase";

export type Edition = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status: "draft" | "active" | "closed";
  is_active: boolean;
};

export async function getActiveEdition(): Promise<Edition> {
  const { data, error } = await supabase
    .from("editions")
    .select("*")
    .eq("is_active", true)
    .eq("status", "active")
    .single();

  if (error) {
    throw new Error(`No se pudo obtener la edición activa: ${error.message}`);
  }

  if (!data) {
    throw new Error("No existe una edición activa configurada.");
  }

  return data as Edition;
}
