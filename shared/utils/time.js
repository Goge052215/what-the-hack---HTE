const toDate = (value) => {
  if (!value) return new Date();
  return value instanceof Date ? value : new Date(value);
};

const toIso = (value) => toDate(value).toISOString();

const startOfDay = (value) => {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addMinutes = (value, minutes) => {
  const date = toDate(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

const differenceInDays = (a, b) => {
  const diffMs = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(diffMs / 86400000);
};

const getHour = (value) => toDate(value).getHours();

const formatTime = (value) => {
  const date = toDate(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

module.exports = {
  toDate,
  toIso,
  startOfDay,
  addMinutes,
  differenceInDays,
  getHour,
  formatTime,
  clamp,
};
