const filterPersons = (persons) => {
  persons.forEach((person) => {
    person.id = person._key;
    person.name = person.name;
    person.age = person.age;
    person.pets = person.pets;
    person.friends = person.friends;
    delete person._key;
    delete person._id;
    delete person._rev;
  });
  //   console.log("persons", persons);
  return persons;
};

const filterPets = (pets) => {
  pets.forEach((pet) => {
    pet.id = pet._key;
    pet.name = pet.name;
    pet.age = pet.age;
    pet.pets = pet.pets;
    pet.friends = pet.friends;
    delete pet._key;
    delete pet._id;
    delete pet._rev;
  });
  //   console.log("pets", pets);
  return pets;
};
module.exports = { filterPersons, filterPets };
