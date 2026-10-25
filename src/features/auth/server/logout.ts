import { deleteCurrentSession, isSameOriginRequest } from "./auth"

export async function handleLogout(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Permintaan lintas origin ditolak." }, { status: 403 })
  }

  try {
    await deleteCurrentSession()
    return Response.json({ ok: true })
  } catch (error) {
    console.error("Logout request failed.", error)
    return Response.json({ error: "Logout gagal. Silakan coba lagi." }, { status: 500 })
  }
}
