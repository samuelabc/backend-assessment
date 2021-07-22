const Joi = require("joi");

const petSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().integer().min(0).allow(null),
  type: Joi.string().allow(null),
  owner: Joi.string().allow(null),
});

module.exports = petSchema;
