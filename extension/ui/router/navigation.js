import { routes } from "./routes.js";

export const getRoute = () => {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return routes.home;
  return Object.values(routes).includes(hash) ? hash : routes.home;
};

export const setRoute = (route) => {
  if (!Object.values(routes).includes(route)) return;
  window.location.hash = route;
};
