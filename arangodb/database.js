const config = require("../utils/config");
const Database = require("arangojs").Database;
db = new Database({
  url: "http://127.0.0.1:8529",
  databaseName: "people-pets-db",
  auth: { username: config.DB_USERNAME, password: config.DB_PASSWORD },
});
const petsCollection = db.collection("pets");
const peopleCollection = db.collection("people");

module.exports = { db, petsCollection, peopleCollection };
