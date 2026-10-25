import "server-only"

export function hasPermission(userPermissions: string[], permission: string) {
  if (userPermissions.includes("*")) return true
  return userPermissions.includes(permission)
}
