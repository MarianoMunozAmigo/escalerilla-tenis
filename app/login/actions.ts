"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession } from "../../lib/admin-auth";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

 if (!adminUsername || !adminPassword) {
  redirect("/login?error=Falta+configurar+las+credenciales+del+administrador");
}

  if (username !== adminUsername || password !== adminPassword) {
    redirect("/login?error=Credenciales+incorrectas");
  }

  await createAdminSession(username);

  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/login?success=Sesion+cerrada+correctamente");
}
