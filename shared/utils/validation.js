const isObject = (value) => value !== null && typeof value === "object";
const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";
const isArray = (value) => Array.isArray(value);

module.exports = { isObject, isNonEmptyString, isArray };
