const peopleRouter = require("express").Router();
const {
  db,
  petsCollection,
  peopleCollection,
} = require("../arangodb/database");
const { Get_Person_By_PersonId } = require("../arangodb/query");
const { aql } = require("arangojs");
const peopleSchema = require("../models/people");
const { filterPersons } = require("./serviceHelper");
const query = require("../arangodb/query");
const _ = require("lodash");

peopleRouter.get("/:personId", async (request, response) => {
  const personId = request.params.personId;
  console.log("personId", personId);
  try {
    const trx = await db.beginTransaction({
      read: [peopleCollection],
    });
    const person = await trx.step(() => {
      return db
        .query(Get_Person_By_PersonId({ personId: personId }))
        .then((cursor) => cursor.all());
    });
    if (person.length > 0) {
      await trx.commit();
      console.log("person found", person);
      response
        .status(200)
        .json({ message: "person found", data: filterPersons(person) });
    } else {
      //error: person id does not exist
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("person id does not exist");
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

peopleRouter.get("/friend/:friendId", async (request, response) => {
  const friendId = request.params.friendId;
  console.log("friendId", friendId);
  try {
    const trx = await db.beginTransaction({
      read: [peopleCollection],
    });
    const persons = await trx.step(() => {
      return db
        .query(query.Get_Persons_By_FriendId({ friendId: friendId }))
        .then((cursor) => cursor.all());
    });
    console.log("persons", persons);
    if (persons.length > 0) {
      await trx.commit();
      console.log("found persons by friendId", persons);
      response.status(200).json({
        message: "found persons by friendId",
        data: filterPersons(persons),
      });
    } else {
      //error: friend id does not exist
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("friend id does not exist");
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

peopleRouter.post("/", async (request, response) => {
  const body = request.body;
  const insertContent = {
    name: body.name,
    age: body.age,
    pets: body.pets,
    friends: body.friends,
  };

  try {
    const value = await peopleSchema.validateAsync(insertContent);
    const trx = await db.beginTransaction({
      write: [peopleCollection, petsCollection],
    });
    //insert newperson
    const newPerson = await trx.step(() => {
      return db
        .query(query.Insert_Person({ insertContent: insertContent }))
        .then((cursor) => cursor.all());
    });
    if (newPerson[0].pets.length > 0) {
      //remove pets from pets field of prior owners
      const priorOwners = await trx.step(() => {
        return db
          .query(
            query.Remove_Pets_From_Persons({
              currentOwnerId: newPerson[0]._key,
              pets: newPerson[0].pets,
            })
          )
          .then((cursor) => cursor.all());
      });

      //set newperson to be the owner of his pets
      const pets = await trx.step(() => {
        return db
          .query(
            query.Set_Owner_Of_Pets({
              personId: newPerson[0]._key,
              pets: newPerson[0].pets,
            })
          )
          .then((cursor) => cursor.all());
      });
      if (pets.length != newPerson[0].pets.length) {
        //error: pet id not found
        const trxAbort = await trx.abort();
        console.log("trx abort", trxAbort);
        throw Error("pet id does not exist");
      }
    }
    if (newPerson[0].friends.length > 0) {
      //add new person to friends' field of its friend
      const friends = await trx.step(() => {
        return db
          .query(
            query.Set_Person_As_Friend({
              personId: newPerson[0]._key,
              friends: newPerson[0].friends,
            })
          )
          .then((cursor) => cursor.all());
      });
      if (friends.length != newPerson[0].friends.length) {
        //error: friend id not found
        const trxAbort = await trx.abort();
        console.log("trx abort", trxAbort);
        throw Error("friend id does not exist");
      }
    }
    await trx.commit();
    console.log("new person created", newPerson);
    response
      .status(201)
      .json({ message: "new person created", data: filterPersons(newPerson) });
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({
      error: {
        message: err.message,
      },
    });
  }
});

peopleRouter.put("/:personId", async (request, response) => {
  try {
    const personId = request.params.personId;
    const body = request.body;
    const updateContent = {
      name: body.name,
      age: body.age,
      pets: body.pets,
      friends: body.friends,
    };
    const value = await peopleSchema.validateAsync(updateContent);
    const trx = await db.beginTransaction({
      write: [peopleCollection, petsCollection],
    });
    //replace person
    const newAndOldPerson = await trx.step(() => {
      return db
        .query(
          query.Update_Person({
            personId: personId,
            updateContent: updateContent,
          })
        )
        .then((cursor) => cursor.all());
    });
    if (newAndOldPerson.length <= 0) {
      //person not found
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("person id does not exist");
    }
    const newPerson = [newAndOldPerson[0].new];
    const oldPerson = [newAndOldPerson[0].old];
    //get complement element of newperson.pets and oldperson.pets
    const petsToRemove = _.difference(
      newPerson[0].pets,
      oldPerson[0].pets
    ).concat(_.difference(oldPerson[0].pets, newPerson[0].pets));
    if (petsToRemove.length > 0) {
      //remove pets from pets field of prior owners
      const priorOwners = await trx.step(() => {
        return db
          .query(
            query.Remove_Pets_From_Persons({
              currentOwnerId: newPerson[0]._key,
              pets: petsToRemove,
            })
          )
          .then((cursor) => cursor.all());
      });
      //clear owner field of pets which are present in oldperson.pets but not in newperson.pets
      await trx.step(() => {
        return db
          .query(
            query.Clear_Owner_Of_Selected_Pets({
              pets: _.difference(oldPerson[0].pets, newPerson[0].pets),
            })
          )
          .then((cursor) => cursor.all());
      });

      //set owner field of pets to be newperson
      const pets = await trx.step(() => {
        return db
          .query(
            query.Set_Owner_Of_Pets({
              personId: newPerson[0]._key,
              pets: newPerson[0].pets,
            })
          )
          .then((cursor) => cursor.all());
      });
      if (pets.length != newPerson[0].pets.length) {
        //error: pet id not found
        const trxAbort = await trx.abort();
        console.log("trx abort", trxAbort);
        throw Error("pet id does not exist");
      }
    }
    const friendsComplement = _.difference(
      newPerson[0].friends,
      oldPerson[0].friends
    ).concat(_.difference(oldPerson[0].friends, newPerson[0].friends));
    if (friendsComplement.length > 0) {
      //remove person from friends field of friends who are present in oldperson.friends but not in newperson.friends
      await trx.step(() => {
        return db
          .query(
            query.Unassign_Friend({
              personId: newPerson[0]._key,
              friends: _.difference(oldPerson[0].friends, newPerson[0].friends),
            })
          )
          .then((cursor) => cursor.all());
      });
      //add new person to friends' field of its friend
      const friendNotInOldPerson = _.difference(
        newPerson[0].friends,
        oldPerson[0].friends
      );
      const newAddedFriend = await trx.step(() => {
        return db
          .query(
            query.Set_Person_As_Friend({
              personId: newPerson[0]._key,
              friends: friendNotInOldPerson,
            })
          )
          .then((cursor) => cursor.all());
      });
      if (newAddedFriend.length != friendNotInOldPerson.length) {
        //error: friend id not found
        const trxAbort = await trx.abort();
        console.log("trx abort", trxAbort);
        throw Error("friend id does not exist");
      }
    }
    await trx.commit();
    console.log("person updated", newPerson);
    response
      .status(200)
      .json({ message: "person updated", data: filterPersons(newPerson) });
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({
      error: {
        message: err.message,
      },
    });
  }
});

peopleRouter.patch("/:personId", async (request, response) => {
  try {
    const personId = request.params.personId;
    const body = request.body;

    const trx = await db.beginTransaction({
      write: [peopleCollection, petsCollection],
    });
    //find original person for validation purpose
    const originalPerson = await trx.step(() => {
      return db
        .query(
          query.Get_Person_By_PersonId({
            personId: personId,
          })
        )
        .then((cursor) => cursor.all());
    });
    if (originalPerson.length <= 0) {
      //person not found
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("person id does not exist");
    }

    const updateContent = {
      name: body.name !== undefined ? body.name : originalPerson[0].name,
      age: body.age !== undefined ? body.age : originalPerson[0].age,
      pets: body.pets !== undefined ? body.pets : originalPerson[0].pets,
      friends:
        body.friends !== undefined ? body.friends : originalPerson[0].friends,
    };
    console.log("body", body);

    console.log("body.name", body.name);
    console.log("updateContent", updateContent);
    //people schema validation
    const value = await peopleSchema.validateAsync(updateContent);

    //replace person
    const newAndOldPerson = await trx.step(() => {
      return db
        .query(
          query.Update_Person({
            personId: personId,
            updateContent: updateContent,
          })
        )
        .then((cursor) => cursor.all());
    });
    const newPerson = [newAndOldPerson[0].new];
    const oldPerson = [newAndOldPerson[0].old];
    //get complement element of newperson.pets and oldperson.pets
    const petsToRemove = _.difference(
      newPerson[0].pets,
      oldPerson[0].pets
    ).concat(_.difference(oldPerson[0].pets, newPerson[0].pets));
    if (petsToRemove.length > 0) {
      //remove pets from pets field of prior owners
      const priorOwners = await trx.step(() => {
        return db
          .query(
            query.Remove_Pets_From_Persons({
              currentOwnerId: newPerson[0]._key,
              pets: petsToRemove,
            })
          )
          .then((cursor) => cursor.all());
      });
      //clear owner field of pets which are present in oldperson.pets but not in newperson.pets
      await trx.step(() => {
        return db
          .query(
            query.Clear_Owner_Of_Selected_Pets({
              pets: _.difference(oldPerson[0].pets, newPerson[0].pets),
            })
          )
          .then((cursor) => cursor.all());
      });

      //set owner field of pets to be newperson
      const pets = await trx.step(() => {
        return db
          .query(
            query.Set_Owner_Of_Pets({
              personId: newPerson[0]._key,
              pets: newPerson[0].pets,
            })
          )
          .then((cursor) => cursor.all());
      });
      if (pets.length != newPerson[0].pets.length) {
        //error: pet id not found
        const trxAbort = await trx.abort();
        console.log("trx abort", trxAbort);
        throw Error("pet id does not exist");
      }
    }
    const friendsComplement = _.difference(
      newPerson[0].friends,
      oldPerson[0].friends
    ).concat(_.difference(oldPerson[0].friends, newPerson[0].friends));
    if (friendsComplement.length > 0) {
      //remove person from friends field of friends who are present in oldperson.friends but not in newperson.friends
      await trx.step(() => {
        return db
          .query(
            query.Unassign_Friend({
              personId: newPerson[0]._key,
              friends: _.difference(oldPerson[0].friends, newPerson[0].friends),
            })
          )
          .then((cursor) => cursor.all());
      });
      //add new person to friends' field of its friend
      const friendNotInOldPerson = _.difference(
        newPerson[0].friends,
        oldPerson[0].friends
      );
      const newAddedFriend = await trx.step(() => {
        return db
          .query(
            query.Set_Person_As_Friend({
              personId: newPerson[0]._key,
              friends: friendNotInOldPerson,
            })
          )
          .then((cursor) => cursor.all());
      });
      if (newAddedFriend.length != friendNotInOldPerson.length) {
        //error: friend id not found
        const trxAbort = await trx.abort();
        console.log("trx abort", trxAbort);
        throw Error("friend id does not exist");
      }
    }
    await trx.commit();
    console.log("person updated", newPerson);
    response
      .status(200)
      .json({ message: "person updated", data: filterPersons(newPerson) });
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({
      error: {
        message: err.message,
      },
    });
  }
});

peopleRouter.delete("/:personId", async (request, response) => {
  const personId = request.params.personId;
  console.log("personId", personId);
  try {
    const trx = await db.beginTransaction({
      write: [peopleCollection, petsCollection],
    });
    //remove person
    const oldPerson = await trx.step(() => {
      return db
        .query(query.Remove_Person_By_PersonId({ personId: personId }))
        .then((cursor) => cursor.all());
    });
    if (oldPerson.length <= 0) {
      //person not found
      const trxAbort = await trx.abort();
      console.log("trx abort", trxAbort);
      throw Error("person id does not exist");
    }
    if (oldPerson[0].pets.length > 0) {
      //unassign all pets from person
      const priorPets = await trx.step(() => {
        return db
          .query(query.Unassign_Owner_Of_Pets({ ownerId: personId }))
          .then((cursor) => cursor.all());
      });
    }
    if (oldPerson[0].friends.length > 0) {
      //unassign all friends from person
      const priorFriends = await trx.step(() => {
        return db
          .query(query.Unassign_Friend_From_Persons({ friendId: personId }))
          .then((cursor) => cursor.all());
      });
    }
    await trx.commit();
    console.log("oldPerson", oldPerson);
    response
      .status(200)
      .json({ message: "person deleted", data: filterPersons(oldPerson) });
  } catch (err) {
    console.error("error", err.message);
    response.status(400).json({
      error: {
        message: err.message,
      },
    });
  }
});

module.exports = peopleRouter;
