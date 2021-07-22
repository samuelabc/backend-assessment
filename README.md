# backend-assessment

This is a backend server, using express.js as API server, and ArangoDB as database.

## Set up the project

1. Run `npm install` to install node-modules dependencies.
2. Open the `.env` file, change the value of PORT, DB_USERNAME and DB_PASSWORD to appropriate value.
3. Run `npm run db-init` to initialize the ArangoDB database, creating a new database called `people-pets-db`, and two collections called `pets` and `people`.
4. Run `npm start` to start the backend, or run `npm run dev` to run the backend on development mode.

## Testing

1. Using Mocha and Chai to test the API endpoints. Testing files are located at `/test` directory.
2. Run `npm test` to run the test.

## Model design

Models definition are stored in `/models` directory.
Enforcing data models using JOI.

1. pet model

```
const petSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().integer().min(0).allow(null),
  type: Joi.string().allow(null),
  owner: Joi.string().allow(null),
});
```

2. person model

```
const peopleSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().integer().min(0).allow(null),
  pets: Joi.array().items(Joi.string()).unique(),
  friends: Joi.array().items(Joi.string()).unique(),
});
```

## API design

### Create API

1. `POST /api/pets/`\
   Create a new pet. Response with newly created pet.
2. `POST /api/people/`\
   Create a new person. Response with newly created person.

### Read API

1. `GET /api/pets/{petId}`\
   Search pet by petId. Response with pet of this petId.
2. `GET /api/pets/person/{personId}`\
   Search pet by personId. Response with pets belong to this person.
3. `GET /api/people/{personId}`\
   Search person by personId. Response with person of this personId.
4. `GET /api/people/friend/{friendId}`\
   Search person by friendId. Response with friends(persons) of this friend stated by friendId.

### Update API

1. `PUT /api/pets/{petId}`\
   Update(fully) pet of this petId. Response with updated pet.
2. `PUT /api/people/{personId}`\
   Update(fully) person of this personId. Response with updated person.
3. `PATCH /api/pets/{petId}`\
   Update(partially) pet of this petId. Response with updated pet.
4. `PATCH /api/pets/{personId}`\
   Update(partially) person of this personId. Response with updated person.

### Delete API

1. `DELETE /api/pets/{petId}`\
   Delete pet of this petId. Response with pet being deleted.
2. `DELETE /api/people/{personId}`\
   Delete person of this personId. Response with person being deleted.

### Improved functionality

1. Using middleware to log request information and response status.
2. Using middleware to handle unknown endpoint, when encounter, response with 404 error.
3. Error handling. During CRUD operation, break the operation and response with error message when encounter with error, including pet-not-exist error, person-not-exist-error, and model-format-error.
4. Using transactions during CRUD operations, to ensure ACID properties of these operations.
