const config = require("./utils/config");
const Database = require("arangojs").Database;
async function dbInit() {
  var db = new Database({
    url: "http://127.0.0.1:8529",
    auth: { username: config.DB_USERNAME, password: config.DB_PASSWORD },
  });
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

  //drop database
  //   await db.dropDatabase("people-pets-db");
}

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
dbInit();
