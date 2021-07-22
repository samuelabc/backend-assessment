const express = require("express");
const morgan = require("morgan");
const { unknownEndpoint } = require("./utils/middleware");
const peopleRouter = require("./routers/people");
const petsRouter = require("./routers/pets");
const helmet = require("helmet");
const app = express();

app.use(express.json());
app.use(helmet());

morgan.token("requestBody", (req, res) => JSON.stringify(req.body));
app.use(
  morgan(
    ":method :url :status :response-time ms - :res[content-length] - :req[content-length] :requestBody"
  )
);

app.use("/api/people", peopleRouter);
app.use("/api/pets", petsRouter);
app.use(unknownEndpoint);

module.exports = app;
