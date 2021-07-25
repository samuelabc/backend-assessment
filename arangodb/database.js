const config = require("../utils/config");
const Database = require("arangojs").Database;

const arango_url = `http://${config.ARANGO_IP}:${config.ARANGO_PORT}`;
console.log("ARANGO_IP", config.ARANGO_IP);
console.log("ARANGO_PORT", config.ARANGO_PORT);
console.log("arango_url", arango_url);
console.log("username", config.DB_USERNAME);
console.log("password", config.DB_PASSWORD);
console.log("ARANGO_ROOT_PASSWORD", process.env.ARANGO_ROOT_PASSWORD);
async function dbInit() {
  var db = new Database({
    url: arango_url,
    auth: { username: config.DB_USERNAME, password: config.DB_PASSWORD },
  });

  //drop database
  // await db.dropDatabase("people-pets-db");

  await db.createDatabase("people-pets-db").then(
    () => console.log("Database created"),
    (err) => console.error("Failed to create database:", err.message)
  );
  db = db.database("people-pets-db");
  await db.createCollection("pets", { schema: petsSchema }).then(
    () => console.log("Collection pets created"),
    (err) => console.error("Failed to create pets collection:", err.message)
  );
  await db.createCollection("people", { schema: peopleSchema }).then(
    () => console.log("Collection people created"),
    (err) => console.error("Failed to create people collection:", err.message)
  );
}
dbInit();
const db = new Database({
  url: arango_url,
  databaseName: "people-pets-db",
  auth: { username: config.DB_USERNAME, password: config.DB_PASSWORD },
});
const petsCollection = db.collection("pets");
const peopleCollection = db.collection("people");

const petsSchema = {
  message: "",
  level: "strict",
  rule: {
    properties: {
      name: {
        type: "string",
      },
      age: {
        type: ["number", "null"],
        minimum: 0,
      },
      type: {
        type: ["string", "null"],
      },
      owner: {
        type: ["string", "null"],
      },
    },
    required: ["name"],
  },
};
const peopleSchema = {
  message: "",
  level: "strict",
  rule: {
    properties: {
      name: {
        type: "string",
      },
      age: {
        type: ["number", "null"],
        minimum: 0,
      },
      pets: {
        type: "array",
        items: {
          type: ["string"],
        },
      },
      friends: {
        type: "array",
        items: {
          type: ["string"],
        },
      },
    },
    required: ["name"],
  },
};

module.exports = { db, petsCollection, peopleCollection };
