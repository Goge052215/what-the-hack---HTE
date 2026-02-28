export const canAccess = (roles = [], permission) => {
  if (!permission) return true;
  if (roles.includes("admin")) return true;
  return permission === "user" && roles.includes("user");
};
