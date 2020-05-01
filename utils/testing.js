const isTesting = () => process.env.NODE_ENV === "test";

module.exports = { isTesting };
