const requireRole = (roles = []) => (req, res) => {
  const userRoles = req.user?.roles || [];
  const allowed = roles.length === 0 || roles.some((role) => userRoles.includes(role));
  if (!allowed) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "forbidden" }));
    return false;
  }
  return true;
};

module.exports = { requireRole };
