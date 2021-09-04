require("dotenv").config();
const PORT = process.env.PORT;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.ARANGO_ROOT_PASSWORD || process.env.DB_PASSWORD;
const ARANGO_IP = process.env.ARANGO_IP || "arango";
const ARANGO_PORT = process.env.ARANGO_PORT || 8529;

module.exports = {
  PORT,
  DB_USERNAME,
  DB_PASSWORD,
  ARANGO_IP,
  ARANGO_PORT,
};
