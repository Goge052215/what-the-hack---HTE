export const normalizeResponse = (payload) => {
  if (!payload) return { ok: false, error: "invalid_response" };
  return {
    ok: Boolean(payload.ok),
    data: payload.data || null,
    error: payload.error || null,
  };
};
