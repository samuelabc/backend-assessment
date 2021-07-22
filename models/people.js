const Joi = require("joi");
const peopleSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().integer().min(0).allow(null),
  pets: Joi.array().items(Joi.string()).unique(),
  friends: Joi.array().items(Joi.string()).unique(),
});
module.exports = peopleSchema;
