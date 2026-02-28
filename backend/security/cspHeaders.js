const applyCspHeaders = (res) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );
};

module.exports = { applyCspHeaders };
