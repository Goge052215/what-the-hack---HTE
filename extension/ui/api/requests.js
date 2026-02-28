/*
export const buildLoginRequest = (userId) => ({
  path: "/api/auth/login",
  method: "POST",
  body: { userId },
});

export const buildLogoutRequest = () => ({
  path: "/api/auth/logout",
  method: "POST",
});
*/

export const buildTaskCreateRequest = (title) => ({
  path: "/api/tasks",
  method: "POST",
  body: { title },
});
