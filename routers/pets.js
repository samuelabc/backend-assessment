const petsRouter = require("express").Router();
const {
  db,
  petsCollection,
  peopleCollection,
} = require("../arangodb/database");
const petSchema = require("../models/pet");
const query = require("../arangodb/query");
const { filterPets } = require("./serviceHelper");

petsRouter.get("/:petId", async (request, response) => {
  const petId = request.params.petId;
  try {
    const trx = await db.beginTransaction({
      read: [petsCollection],
    });
    const pet = await trx.step(() => {
      return db
        .query(query.Get_Pet_By_PetId({ petId: petId }))
        .then((cursor) => cursor.all());
    });
    if (pet.length > 0) {
      await trx.commit();
      console.log("pet found", pet);
      response
        .status(200)
        .json({ message: "pet found", data: filterPets(pet) });
    } else {
      //error: pet id does not exist
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("pet id does not exist");
    }
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({
      error: {
        message: err.message,
      },
    });
  }
});

petsRouter.get("/person/:personId", async (request, response) => {
  const personId = request.params.personId;
  try {
    const trx = await db.beginTransaction({
      read: [peopleCollection, petsCollection],
    });
    const person = await trx.step(() => {
      return db
        .query(query.Get_Person_By_PersonId({ personId: personId }))
        .then((cursor) => cursor.all());
    });
    if (person.length <= 0) {
      //error: person id does not exist
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("person id does not exist");
    }
    const pets = await trx.step(() => {
      return db
        .query(query.Get_Pets_Of_Person({ personId: personId }))
        .then((cursor) => cursor.all());
    });
    await trx.commit();
    console.log("found pets of person", pets);
    response
      .status(200)
      .json({ message: "found pets of person", data: filterPets(pets) });
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({
      error: {
        message: err.message,
      },
    });
  }
});

petsRouter.post("/", async (request, response) => {
  const body = request.body;
  const insertContent = {
    name: body.name,
    age: body.age,
    type: body.type,
    owner: body.owner,
  };
  console.log("insertcontent", insertContent);
  try {
    const validateResult = await petSchema.validateAsync(insertContent);
    const trx = await db.beginTransaction({
      write: [peopleCollection, petsCollection],
    });
    //insert new pet
    const newPet = await trx.step(() => {
      return db
        .query(query.Insert_Pet({ insertContent: insertContent }))
        .then((cursor) => cursor.all());
    });
    if (insertContent.owner) {
      //insert pet to pets field of owner
      const owner = await trx.step(() => {
        return db
          .query(
            query.Add_Pet_To_Person({
              ownerId: newPet[0].owner,
              petId: newPet[0]._key,
            })
          )
          .then((cursor) => cursor.all());
      });
      if (owner.length <= 0) {
        const trxAbort = await trx.abort();
        console.log("trx abort", trxAbort);
        throw Error("owner id does not exist");
      }
    }
    await trx.commit();
    console.log("new pet created", newPet);
    response
      .status(201)
      .json({ message: "new pet created", data: filterPets(newPet) });
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({
      error: {
        message: err.message,
      },
    });
  }
});

petsRouter.put("/:petId", async (request, response) => {
  const petId = request.params.petId;
  const body = request.body;
  const updateContent = {
    name: body.name,
    age: body.age,
    type: body.type,
    owner: body.owner,
  };
  try {
    const value = await petSchema.validateAsync(updateContent);

    const trx = await db.beginTransaction({
      write: [peopleCollection, petsCollection],
    });
    //replace pet
    const newAndOldPet = await trx.step(() => {
      return db
        .query(
          query.Update_Pet({
            petId: petId,
            updateContent: updateContent,
          })
        )
        .then((cursor) => cursor.all());
    });
    if (newAndOldPet.length <= 0) {
      //error: pet not found
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("pet id does not exist");
    }
    var newPet = [newAndOldPet[0].new];
    var oldPet = [newAndOldPet[0].old];
    var ownerEqual =
      (!oldPet[0].owner && !newPet[0].owner) ||
      (oldPet[0].owner &&
        newPet[0].owner &&
        oldPet[0].owner === newPet[0].owner);
    console.log("ownerequal", ownerEqual);
    if (oldPet[0].owner && !ownerEqual) {
      //remove pet from old owner's pets field
      const oldOwner = await trx.step(() => {
        return db
          .query(
            query.Remove_Pet_From_Person({
              ownerId: oldPet[0].owner,
              petId: oldPet[0]._key,
            })
          )
          .then((cursor) => cursor.all());
      });
    }
    if (newPet[0].owner && !ownerEqual) {
      //add pet to new owner's pets field
      const newOwner = await trx.step(() => {
        return db
          .query(
            query.Add_Pet_To_Person({
              ownerId: newPet[0].owner,
              petId: newPet[0]._key,
            })
          )
          .then((cursor) => cursor.all());
      });
      console.log("newOwner", newOwner);

      if (newOwner.length <= 0) {
        //new owner not found
        const trxAbort = await trx.abort();
        console.log("trx abort", trxAbort);
        throw Error("owner id does not exist");
      }
    }
    await trx.commit();
    console.log("pet updated", newPet);
    response
      .status(200)
      .json({ message: "pet updated", data: filterPets(newPet) });
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({ message: err.message });
  }
});

petsRouter.patch("/:petId", async (request, response) => {
  const petId = request.params.petId;
  const body = request.body;
  try {
    const trx = await db.beginTransaction({
      write: [peopleCollection, petsCollection],
    });
    //get original pet for validation purpose
    const originalPet = await trx.step(() => {
      return db
        .query(
          query.Get_Pet_By_PetId({
            petId: petId,
          })
        )
        .then((cursor) => cursor.all());
    });
    if (originalPet.length <= 0) {
      //pet not found
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("pet id does not exist");
    }
    const updateContent = {
      name: body.name !== undefined ? body.name : originalPet[0].name,
      age: body.age !== undefined ? body.age : originalPet[0].age,
      type: body.type !== undefined ? body.type : originalPet[0].type,
      owner: body.owner !== undefined ? body.owner : originalPet[0].owner,
    };
    console.log("updateContent", updateContent);
    const value = await petSchema.validateAsync(updateContent);

    //replace pet
    const newAndOldPet = await trx.step(() => {
      return db
        .query(
          query.Update_Pet({
            petId: petId,
            updateContent: updateContent,
          })
        )
        .then((cursor) => cursor.all());
    });
    var newPet = [newAndOldPet[0].new];
    var oldPet = [newAndOldPet[0].old];
    var ownerEqual =
      (!oldPet[0].owner && !newPet[0].owner) ||
      (oldPet[0].owner &&
        newPet[0].owner &&
        oldPet[0].owner === newPet[0].owner);
    if (oldPet[0].owner && !ownerEqual) {
      //remove pet from old owner's pets field
      const oldOwner = await trx.step(() => {
        return db
          .query(
            query.Remove_Pet_From_Person({
              ownerId: oldPet[0].owner,
              petId: oldPet[0]._key,
            })
          )
          .then((cursor) => cursor.all());
      });
      // console.log("oldOwner", oldOwner);
    }
    if (newPet[0].owner && !ownerEqual) {
      //add pet to new owner's pets field
      const newOwner = await trx.step(() => {
        return db
          .query(
            query.Add_Pet_To_Person({
              ownerId: newPet[0].owner,
              petId: newPet[0]._key,
            })
          )
          .then((cursor) => cursor.all());
      });
      if (newOwner.length <= 0) {
        //new owner not found
        const trxAbort = await trx.abort();
        console.log("trx abort", trxAbort);
        throw Error("owner id does not exist");
      }
    }
    await trx.commit();
    console.log("pet updated", newPet);
    response
      .status(200)
      .json({ message: "pet updated", data: filterPets(newPet) });
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({ message: err.message });
  }
});

petsRouter.delete("/:petId", async (request, response) => {
  const petId = request.params.petId;
  console.log("petId", petId);
  try {
    const trx = await db.beginTransaction({
      write: [peopleCollection, petsCollection],
    });
    const oldPet = await trx.step(() => {
      return db
        .query(query.Remove_Pet_By_PetId({ petId: petId }))
        .then((cursor) => cursor.all());
    });
    if (oldPet.length <= 0) {
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("pet id does not exist");
    }
    if (oldPet[0].owner) {
      const owner = await trx.step(() => {
        return db
          .query(
            query.Remove_Pet_From_Person({
              ownerId: oldPet[0].owner,
              petId: petId,
            })
          )
          .then((cursor) => cursor.all());
      });
    }
    await trx.commit();
    console.log("pet deleted", oldPet);
    response
      .status(200)
      .json({ message: "pet deleted", data: filterPets(oldPet) });
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({
      error: {
        message: err.message,
      },
    });
  }
});
module.exports = petsRouter;
