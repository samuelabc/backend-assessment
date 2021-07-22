const {
  db,
  petsCollection,
  peopleCollection,
} = require("../arangodb/database");
const { aql } = require("arangojs");

const Get_Person_By_PersonId = ({ personId }) => {
  return aql`
	FOR person IN ${peopleCollection}
	FILTER person._key == ${personId}
	RETURN person
`;
};
const Get_Persons_By_FriendId = ({ friendId }) => {
  return aql`
      FOR friend IN ${peopleCollection}
        FILTER friend._key == ${friendId}
        FOR person in people
          FILTER POSITION( friend.friends ,person._key)
          RETURN person
    `;
};
const Get_Pet_By_PetId = ({ petId }) => {
  return aql`
	FOR pet IN ${petsCollection}
	FILTER pet._key == ${petId}
	RETURN pet
`;
};
const Get_Pets_Of_Person = ({ personId }) => {
  return aql`
	FOR person IN ${peopleCollection}
	FILTER person._key == ${personId}
	FOR pet IN ${petsCollection}
	FILTER POSITION(person.pets, pet._key)
	RETURN pet
`;
};
const Insert_Person = ({ insertContent }) => {
  return aql`
  INSERT ${insertContent}
  INTO ${peopleCollection}
  RETURN NEW
      `;
};
const Insert_Pet = ({ insertContent }) => {
  return aql`
	INSERT ${insertContent}
	INTO ${petsCollection}
	RETURN NEW
	`;
};

const Add_Pet_To_Person = ({ ownerId, petId }) => {
  return aql`
	FOR person IN ${peopleCollection}
	FILTER person._key == ${ownerId} 
		&& !POSITION (person.pets, ${petId})
	UPDATE person WITH {pets: PUSH(person.pets, ${petId})} IN people
	RETURN NEW
      `;
};

const Update_Pet = ({ petId, updateContent }) => {
  return aql`
	FOR pet IN ${petsCollection}
	FILTER pet._key == ${petId}
	UPDATE pet WITH ${updateContent} IN ${petsCollection}
      RETURN {new:NEW, old:OLD}
	      `;
};
const Update_Person = ({ personId, updateContent }) => {
  return aql`
FOR person IN ${peopleCollection}
	FILTER person._key == ${personId}
	UPDATE person WITH ${updateContent} in ${peopleCollection}
	RETURN {new:NEW, old:OLD}
`;
};

const Set_Person_As_Friend = ({ personId, friends }) => {
  console.log("personId", personId);
  console.log("friends", friends);
  return aql`
        FOR person IN ${peopleCollection}
          FILTER POSITION(${friends}, person._key) == true 
            && POSITION(person.friends, ${personId}) == false
          UPDATE person WITH {friends: PUSH(person.friends, ${personId})} 
	  IN ${peopleCollection}
          RETURN NEW
      `;
};
const Set_Owner_Of_Pets = ({ personId, pets }) => {
  return aql`
        FOR pet IN ${petsCollection}
          FILTER POSITION(${pets}, pet._key) == true 
          UPDATE pet WITH {owner: ${personId}} IN ${petsCollection}
          RETURN NEW
        `;
};

const Unassign_Owner_Of_Pets = ({ ownerId }) => {
  return aql`
FOR pet IN ${petsCollection}
	FILTER pet.owner == ${ownerId}
	UPDATE pet WITH {owner: null} IN ${petsCollection}
	RETURN NEW
`;
};
const Clear_Owner_Of_Selected_Pets = ({ pets }) => {
  return aql`
	FOR pet IN ${petsCollection}
		FILTER POSITION(${pets}, pet._key)
		UPDATE pet WITH {owner:null} IN ${petsCollection}
	RETURN NEW
	`;
};
const Unassign_Friend_From_Persons = ({ friendId }) => {
  console.log("frienid", friendId);
  return aql`
FOR person IN ${peopleCollection}
	FILTER POSITION(person.friends, ${friendId})
	UPDATE person WITH {friends : REMOVE_VALUE(person.friends, ${friendId})}
	IN ${peopleCollection}
	RETURN NEW
`;
};
const Unassign_Friend = ({ personId, friends }) => {
  //person in ${friends} should remove personId from friends field
  //   console.log("personId", personId);
  //   console.log("friends", friends);
  return aql`
	FOR person IN ${peopleCollection}
	FILTER POSITION(${friends}, person._key)
		&& POSITION(person.friends, ${personId})==true
	UPDATE person WITH {friends : REMOVE_VALUE(person.friends, ${personId})} 
	IN ${peopleCollection}
	RETURN NEW
	`;
};

const Remove_Pet_By_PetId = ({ petId }) => {
  return aql`
	FOR pet IN ${petsCollection} 
	FILTER pet._key == ${petId}
	REMOVE pet IN ${petsCollection}
	RETURN OLD
`;
};
const Remove_Person_By_PersonId = ({ personId }) => {
  return aql`
	FOR person IN ${peopleCollection} 
		FILTER person._key == ${personId}
		REMOVE person IN ${peopleCollection}
		RETURN OLD
	`;
};
const Remove_Pet_From_Person = ({ ownerId, petId }) => {
  return aql`
	FOR person IN ${peopleCollection}
	FILTER person._key == ${ownerId}
	&& POSITION(person.pets, ${petId})==true
	UPDATE person WITH {pets: REMOVE_VALUE(person.pets, ${petId})} IN ${peopleCollection}
	RETURN NEW
`;
};

const Remove_Pets_From_Persons = ({ currentOwnerId, pets }) => {
  return aql`
	FOR person IN ${peopleCollection}
		FOR petId IN ${pets}
		FILTER person._key != ${currentOwnerId} && POSITION(person.pets, petId) == true 
		UPDATE person WITH {pets: REMOVE_VALUE(person.pets, petId)} IN ${peopleCollection}
		RETURN person
      `;
};
module.exports = {
  Get_Person_By_PersonId,
  Get_Persons_By_FriendId,
  Get_Pets_Of_Person,
  Get_Pet_By_PetId,
  Insert_Person,
  Insert_Pet,
  Add_Pet_To_Person,
  Update_Pet,
  Update_Person,
  Set_Person_As_Friend,
  Set_Owner_Of_Pets,
  Unassign_Owner_Of_Pets,
  Clear_Owner_Of_Selected_Pets,
  Unassign_Friend_From_Persons,
  Unassign_Friend,
  Remove_Pet_By_PetId,
  Remove_Person_By_PersonId,
  Remove_Pet_From_Person,
  Remove_Pets_From_Persons,
};
