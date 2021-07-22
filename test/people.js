const chai = require("chai");
const chaiHttp = require("chai-http");
const {
  db,
  petsCollection,
  peopleCollection,
} = require("../arangodb/database");
const { aql } = require("arangojs");
const app = require("../app");
const { expect } = require("chai");
describe("People Test", () => {
  var pet1Created;
  var pet2Created;
  var person1Created;
  var person2Created;
  var person3Created;
  before(() => {
    petsCollection.truncate();
    console.log("Truncated petsCollection");
    peopleCollection.truncate();
    console.log("Truncated peopleCollection");
  });
  describe("create pets", () => {
    it("create pet1, should respond success", (done) => {
      const pet = {
        name: "elee",
        type: "dog",
        age: 2,
        owner: null,
      };
      chai
        .request(app)
        .post(`/api/pets/`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(201);
          pet1Created = res.body.data[0];
          done();
        });
    });
    it("create pet2, should respond success", (done) => {
      const pet = {
        name: "hydra",
        type: "elephant",
        age: 23,
        owner: null,
      };
      chai
        .request(app)
        .post(`/api/pets/`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(201);
          pet2Created = res.body.data[0];
          done();
        });
    });
  });
  describe("create persons", () => {
    it("create person1, with wrong name format, should respond error", (done) => {
      const person = {
        name: "",
        age: 24,
        pets: [pet1Created.id],
        friends: [],
      };
      chai
        .request(app)
        .post(`/api/people/`)
        .send(person)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("create person1, with wrong age format, should respond error", (done) => {
      const person = {
        name: "elle",
        age: "24",
        pets: [pet1Created.id],
        friends: [],
      };
      chai
        .request(app)
        .post(`/api/people/`)
        .send(person)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("create person1, with non-exist petId, should respond error", (done) => {
      const person = {
        name: "elle",
        age: 24,
        pets: ["abc 123"],
        friends: [],
      };
      chai
        .request(app)
        .post(`/api/people/`)
        .send(person)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("create person1, with non-exist personId, should respond error", (done) => {
      const person = {
        name: "elle",
        age: 24,
        pets: [],
        friends: ["abc 123"],
      };
      chai
        .request(app)
        .post(`/api/people/`)
        .send(person)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("create person1, should respond success", (done) => {
      const person = {
        name: "samuel",
        age: 24,
        pets: [pet1Created.id],
        friends: [],
      };
      chai
        .request(app)
        .post(`/api/people/`)
        .send(person)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].id).to.be.a("string");
          expect(res.body.data[0].name).to.be.eql(person.name);
          expect(res.body.data[0].age).to.be.eql(person.age);
          expect(res.body.data[0].pets).to.be.a("array");
          expect(res.body.data[0].pets.length).to.be.eql(person.pets.length);
          expect(res.body.data[0].pets).to.have.members(person.pets);
          expect(res.body.data[0].friends).to.be.a("array");
          expect(res.body.data[0].friends.length).to.be.eql(
            person.friends.length
          );
          expect(res.body.data[0].friends).to.have.members(person.friends);
          person1Created = res.body.data[0];
          done();
        });
    });
    it("create person2, should respond success", (done) => {
      const person = {
        name: "kim ko",
        age: 50,
        pets: [pet2Created.id],
        friends: [person1Created.id],
      };
      chai
        .request(app)
        .post(`/api/people/`)
        .send(person)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].id).to.be.a("string");
          expect(res.body.data[0].name).to.be.eql(person.name);
          expect(res.body.data[0].age).to.be.eql(person.age);
          expect(res.body.data[0].pets).to.be.a("array");
          expect(res.body.data[0].pets.length).to.be.eql(person.pets.length);
          expect(res.body.data[0].pets).to.have.members(person.pets);
          expect(res.body.data[0].friends).to.be.a("array");
          expect(res.body.data[0].friends.length).to.be.eql(
            person.friends.length
          );
          expect(res.body.data[0].friends).to.have.members(person.friends);
          person2Created = res.body.data[0];
          done();
        });
    });
    it("create person3, should respond success", (done) => {
      const person = {
        name: "elza",
        age: 16,
        pets: [],
        friends: [person1Created.id],
      };
      chai
        .request(app)
        .post(`/api/people/`)
        .send(person)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].id).to.be.a("string");
          expect(res.body.data[0].name).to.be.eql(person.name);
          expect(res.body.data[0].age).to.be.eql(person.age);
          expect(res.body.data[0].pets).to.be.a("array");
          expect(res.body.data[0].pets.length).to.be.eql(person.pets.length);
          expect(res.body.data[0].pets).to.have.members(person.pets);
          expect(res.body.data[0].friends).to.be.a("array");
          expect(res.body.data[0].friends.length).to.be.eql(
            person.friends.length
          );
          expect(res.body.data[0].friends).to.have.members(person.friends);
          person3Created = res.body.data[0];
          done();
        });
    });
    describe("get person", () => {
      it("get person by non-exist friendId, should respond error", (done) => {
        const nonExistPersonId = "123 abc";
        chai
          .request(app)
          .get(`/api/people/${nonExistPersonId}`)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("get person1 by person1.id, should respond success", (done) => {
        chai
          .request(app)
          .get(`/api/people/${person1Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.eql(person1Created.id);
            expect(res.body.data[0].name).to.be.eql(person1Created.name);
            expect(res.body.data[0].age).to.be.eql(person1Created.age);
            expect(res.body.data[0].pets).to.be.a("array");
            expect(res.body.data[0].pets.length).to.be.eql(
              person1Created.pets.length
            );
            expect(res.body.data[0].pets).to.have.members(person1Created.pets);
            expect(res.body.data[0].friends).to.be.a("array");
            expect(res.body.data[0].friends.length).to.be.eql(
              person1Created.friends.length + 2
            );
            expect(res.body.data[0].friends).to.have.members(
              person1Created.friends
                .concat(person2Created.id)
                .concat(person3Created.id)
            );
            person1Created = res.body.data[0];
            done();
          });
      });
      it("get person1 by his friend's id', should respond success", (done) => {
        const friendId = person1Created.friends[0];
        chai
          .request(app)
          .get(`/api/people/friend/${friendId}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.greaterThan(0);
            expect(res.body.data).to.be.deep.include(person1Created);
            done();
          });
      });
      it("get person2 by his friend's id', should respond success", (done) => {
        const friendId = person2Created.friends[0];
        chai
          .request(app)
          .get(`/api/people/friend/${friendId}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(2); //person1 has two friends
            expect(res.body.data).to.be.deep.include(person2Created);
            done();
          });
      });
      it("get person3 by his friend's id', should respond success", (done) => {
        const friendId = person3Created.friends[0];
        chai
          .request(app)
          .get(`/api/people/friend/${friendId}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(2); //person1 has two friends
            expect(res.body.data).to.be.deep.include(person3Created);
            done();
          });
      });
    });
    describe("update(put) person", () => {
      it("update(put) person2 with wrong name format, should respond error", (done) => {
        const person = {
          name: null,
          age: 34,
          pets: [pet1Created.id],
          friends: [person1Created.id],
        };
        chai
          .request(app)
          .put(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("update(put) person2 with wrong age format, should respond error", (done) => {
        const person = {
          name: "abdullah kaya",
          age: -1,
          pets: [pet1Created.id],
          friends: [person1Created.id],
        };
        chai
          .request(app)
          .put(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("update(put) person2 with wrong format (non-exist petId), should respond error", (done) => {
        const person = {
          name: "abdullah kaya",
          age: 3,
          pets: ["123 abc"],
          friends: [],
        };
        chai
          .request(app)
          .put(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("update(put) person2 with wrong format (non-exist friendId), should respond error", (done) => {
        const person = {
          name: "abdullah kaya",
          age: 3,
          pets: [pet1Created.id],
          friends: ["123 abc"],
        };
        chai
          .request(app)
          .put(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("update(put) person2, should respond success", (done) => {
        const person = {
          name: "kim ko",
          age: 50,
          pets: [pet1Created.id, pet2Created.id],
          friends: [person3Created.id],
        };
        chai
          .request(app)
          .put(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.a("string");
            expect(res.body.data[0].name).to.be.eql(person.name);
            expect(res.body.data[0].age).to.be.eql(person.age);
            expect(res.body.data[0].pets).to.be.a("array");
            expect(res.body.data[0].pets.length).to.be.eql(person.pets.length);
            expect(res.body.data[0].pets).to.have.members(person.pets);
            expect(res.body.data[0].friends).to.be.a("array");
            expect(res.body.data[0].friends.length).to.be.eql(
              person.friends.length
            );
            expect(res.body.data[0].friends).to.have.members(person.friends);
            person2Created = res.body.data[0];
            done();
          });
      });
      it("updated(put) person2, get person1, person1 pets should not contain pet1, friends should not contain person2", (done) => {
        chai
          .request(app)
          .get(`/api/people/${person1Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.a("string");
            expect(res.body.data[0].name).to.be.eql(person1Created.name);
            expect(res.body.data[0].age).to.be.eql(person1Created.age);
            expect(res.body.data[0].pets).to.be.a("array");
            expect(res.body.data[0].pets.length).to.be.eql(
              person1Created.pets.length - 1
            ); //removed pet1, this pet is assign to person2
            expect(res.body.data[0].pets).to.not.include(pet1Created.id);
            expect(res.body.data[0].friends).to.be.a("array");
            expect(res.body.data[0].friends.length).to.be.eql(
              person1Created.friends.length - 1
            );
            expect(res.body.data[0].friends).to.not.include(person2Created.id);
            person1Created = res.body.data[0];
            done();
          });
      });
      it("updated(put) person2, get person3, person3 friends should contain person2", (done) => {
        chai
          .request(app)
          .get(`/api/people/${person3Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.a("string");
            expect(res.body.data[0].name).to.be.eql(person3Created.name);
            expect(res.body.data[0].age).to.be.eql(person3Created.age);
            expect(res.body.data[0].pets).to.be.a("array");
            expect(res.body.data[0].pets.length).to.be.eql(
              person3Created.pets.length
            );
            expect(res.body.data[0].friends).to.be.a("array");
            expect(res.body.data[0].friends.length).to.be.eql(
              person3Created.friends.length + 1
            );
            expect(res.body.data[0].friends).to.include(person2Created.id);
            person3Created = res.body.data[0];
            done();
          });
      });
      it("updated(put) person2, get pet1, pet1 owner should be person2", (done) => {
        chai
          .request(app)
          .get(`/api/pets/${pet1Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].owner).to.be.eql(person2Created.id);
            pet1Created = res.body.data[0];
            done();
          });
      });
      it("updated(put) person2, get pet2, pet2 owner should be person2", (done) => {
        chai
          .request(app)
          .get(`/api/pets/${pet2Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].owner).to.be.eql(person2Created.id);
            pet2Created = res.body.data[0];
            done();
          });
      });
    });

    describe("update(patch) person", () => {
      it("update(patch) person2 with wrong name format, should respond error", (done) => {
        const person = {
          name: null,
        };
        chai
          .request(app)
          .patch(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("update(patch) person2 with wrong age format, should respond error", (done) => {
        const person = {
          age: -1,
        };
        chai
          .request(app)
          .patch(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("update(patch) person2 with wrong format (non-exist petId), should respond error", (done) => {
        const person = {
          pets: ["123 abc"],
          friends: [],
        };
        chai
          .request(app)
          .patch(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("update(patch) person2 with wrong format (non-exist friendId), should respond error", (done) => {
        const person = {
          friends: ["123 abc"],
        };
        chai
          .request(app)
          .patch(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("update(patch) person2, should respond success", (done) => {
        const person = {
          pets: [pet2Created.id],
          friends: [person1Created.id, person3Created.id],
        };
        chai
          .request(app)
          .patch(`/api/people/${person2Created.id}`)
          .send(person)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.a("string");
            expect(res.body.data[0].name).to.be.eql(person2Created.name);
            expect(res.body.data[0].age).to.be.eql(person2Created.age);
            expect(res.body.data[0].pets).to.be.a("array");
            expect(res.body.data[0].pets.length).to.be.eql(person.pets.length);
            expect(res.body.data[0].pets).to.have.members(person.pets);
            expect(res.body.data[0].friends).to.be.a("array");
            expect(res.body.data[0].friends.length).to.be.eql(
              person.friends.length
            );
            expect(res.body.data[0].friends).to.have.members(person.friends);
            person2Created = res.body.data[0];
            done();
          });
      });
      it("updated(patch) person2, get person1, person1 friends should contain person2", (done) => {
        chai
          .request(app)
          .get(`/api/people/${person1Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.a("string");
            expect(res.body.data[0].name).to.be.eql(person1Created.name);
            expect(res.body.data[0].age).to.be.eql(person1Created.age);
            expect(res.body.data[0].pets).to.be.a("array");
            expect(res.body.data[0].pets.length).to.be.eql(
              person1Created.pets.length
            );
            expect(res.body.data[0].friends).to.be.a("array");
            expect(res.body.data[0].friends.length).to.be.eql(
              person1Created.friends.length + 1
            );
            expect(res.body.data[0].friends).to.include(person2Created.id);
            person1Created = res.body.data[0];
            done();
          });
      });
      it("updated(patch) person2, get person3, person3 friends should contain person2", (done) => {
        chai
          .request(app)
          .get(`/api/people/${person3Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.a("string");
            expect(res.body.data[0].name).to.be.eql(person3Created.name);
            expect(res.body.data[0].age).to.be.eql(person3Created.age);
            expect(res.body.data[0].pets).to.be.a("array");
            expect(res.body.data[0].pets.length).to.be.eql(
              person3Created.pets.length
            );
            expect(res.body.data[0].friends).to.be.a("array");
            expect(res.body.data[0].friends.length).to.be.eql(
              person3Created.friends.length
            );
            expect(res.body.data[0].friends).to.include(person2Created.id);
            person3Created = res.body.data[0];
            done();
          });
      });
      it("updated(patch) person2, get pet1, pet1 owner should be empty", (done) => {
        chai
          .request(app)
          .get(`/api/pets/${pet1Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].owner).to.be.null;
            pet1Created = res.body.data[0];
            done();
          });
      });
      it("updated(patch) person2, get pet2, pet2 owner should be person2", (done) => {
        chai
          .request(app)
          .get(`/api/pets/${pet2Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].owner).to.be.eql(person2Created.id);
            pet2Created = res.body.data[0];
            done();
          });
      });
    });
    describe("delete person", () => {
      it("delete person with a non-exist personId, should respond error", (done) => {
        const nonExistPersonId = "abc 123";
        chai
          .request(app)
          .delete(`/api/people/${nonExistPersonId}`)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("delete person2, should respond success", (done) => {
        chai
          .request(app)
          .delete(`/api/people/${person2Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.eql(person2Created.id);
            expect(res.body.data[0].name).to.be.eql(person2Created.name);
            expect(res.body.data[0].age).to.be.eql(person2Created.age);
            expect(res.body.data[0].pets).to.be.eql(person2Created.pets);
            expect(res.body.data[0].friends).to.be.eql(person2Created.friends);
            done();
          });
      });
      it("deleted person2, get person2 with prior person2.id, should return error", (done) => {
        chai
          .request(app)
          .get(`/api/people/${person2Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("deleted person2, get person1, person1.friends should not contain person2", (done) => {
        chai
          .request(app)
          .get(`/api/people/${person1Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data[0].friends).to.not.include(person2Created.id);
            done();
          });
      });
      it("deleted person2, get person3, person3.friends should not contain person2", (done) => {
        chai
          .request(app)
          .get(`/api/people/${person3Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data[0].friends).to.not.include(person2Created.id);
            done();
          });
      });
      it("deleted person2, get pet2, pet2.owner should be null", (done) => {
        chai
          .request(app)
          .get(`/api/pets/${pet2Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data[0].owner).to.be.null;
            done();
          });
      });
    });
  });
});
