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

chai.use(chaiHttp);

describe("Pets", () => {
  var pet1Created;
  var pet2Created;
  var person1Created;
  var person2Created;
  before(() => {
    petsCollection.truncate();
    console.log("Truncated petsCollection");
    peopleCollection.truncate();
    console.log("Truncated peopleCollection");
  });
  describe("create persons", () => {
    it("create person1, should respond success", (done) => {
      const person1 = {
        name: "samuel",
        age: 24,
        pets: [],
        friends: [],
      };
      chai
        .request(app)
        .post(`/api/people/`)
        .send(person1)
        .end((err, res) => {
          expect(res).to.have.status(201);
          person1Created = res.body.data[0];
          done();
        });
    });
    it("create person2, should respond success", (done) => {
      const person2 = {
        name: "justin",
        age: 30,
        pets: [],
        friends: [person1Created.id],
      };
      chai
        .request(app)
        .post(`/api/people/`)
        .send(person2)
        .end((err, res) => {
          expect(res).to.have.status(201);
          person2Created = res.body.data[0];
          done();
        });
    });
  });

  describe("Create pet1 and pet2", () => {
    it("create pet1 with wrong format, should responds error", (done) => {
      const pet = {
        name: null,
        type: "dog",
        age: 2,
        owner: null,
      };
      chai
        .request(app)
        .post(`/api/pets/`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("create pet1, should responds success", (done) => {
      const pet = {
        name: "cookie",
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
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].id).to.be.a("string");
          expect(res.body.data[0].name).to.be.eql(pet.name);
          expect(res.body.data[0].type).to.be.eql(pet.type);
          expect(res.body.data[0].age).to.be.eql(pet.age);
          expect(res.body.data[0].owner).to.be.eql(pet.owner);
          pet1Created = res.body.data[0];
          done();
        });
    });
    it("create pet2, should responds success", (done) => {
      console.log("id type", typeof person1Created.id);
      const pet = {
        name: "cola",
        type: "cat",
        age: 12,
        owner: person1Created.id,
      };
      chai
        .request(app)
        .post(`/api/pets/`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].id).to.be.a("string");
          expect(res.body.data[0].name).to.be.eql(pet.name);
          expect(res.body.data[0].type).to.be.eql(pet.type);
          expect(res.body.data[0].age).to.be.eql(pet.age);
          expect(res.body.data[0].owner).to.be.eql(pet.owner);
          pet2Created = res.body.data[0];
          done();
        });
    });
    it("get person1 using pet2.owner, should responds success, and person1's pets field should contains pet2", (done) => {
      chai
        .request(app)
        .get(`/api/people/${pet2Created.owner}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].pets).to.include(pet2Created.id);
          person1Created = res.body.data[0];
          done();
        });
    });
  });
  describe("Get pets", () => {
    describe("Get pet using petId", () => {
      it("get pet using a non-exist pet.id, should responds with error", (done) => {
        const nonExistPetId = 24042;
        chai
          .request(app)
          .get(`/api/pets/${nonExistPetId}`)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("get pet1, should responds success", (done) => {
        chai
          .request(app)
          .get(`/api/pets/${pet1Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.eql(pet1Created.id);
            expect(res.body.data[0].name).to.be.eql(pet1Created.name);
            expect(res.body.data[0].type).to.be.eql(pet1Created.type);
            expect(res.body.data[0].age).to.be.eql(pet1Created.age);
            expect(res.body.data[0].owner).to.be.eql(pet1Created.owner);
            done();
          });
      });
      it("get pet2, should responds success", (done) => {
        chai
          .request(app)
          .get(`/api/pets/${pet2Created.id}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.eql(1);
            expect(res.body.data[0].id).to.be.eql(pet2Created.id);
            expect(res.body.data[0].name).to.be.eql(pet2Created.name);
            expect(res.body.data[0].type).to.be.eql(pet2Created.type);
            expect(res.body.data[0].age).to.be.eql(pet2Created.age);
            expect(res.body.data[0].owner).to.be.eql(pet2Created.owner);
            done();
          });
      });
    });
    describe("Get pets using ownerId", () => {
      it("get pet using non-exsit ownerId, should responds error", (done) => {
        const nonExistOwnerId = "abc123";
        chai
          .request(app)
          .get(`/api/pets/person/${nonExistOwnerId}`)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.data).to.be.undefined;
            done();
          });
      });
      it("get pet2 using pet2.owner, should responds success", (done) => {
        chai
          .request(app)
          .get(`/api/pets/person/${pet2Created.owner}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.a("array");
            expect(res.body.data.length).to.be.greaterThan(0);
            console.log("res.body.data", res.body.data);
            expect(res.body.data).to.deep.include(pet2Created);
            done();
          });
      });
    });
  });
  describe("Update(put) pets", () => {
    it("update(put) pe1t with wrong format(wrong name format), should responds error", (done) => {
      const pet = {
        id: pet1Created.id,
        name: "",
        type: "lizard",
        age: null,
        owner: person2Created.id,
      };
      chai
        .request(app)
        .put(`/api/pets/${pet1Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("update(put) pet1 with wrong format(wrong age format), should responds error", (done) => {
      const pet = {
        id: pet1Created.id,
        name: "",
        type: "lizard",
        age: -1,
        owner: person2Created.id,
      };
      chai
        .request(app)
        .put(`/api/pets/${pet1Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("update(put) pet1 with non-exist owner, should responds error", (done) => {
      const pet = {
        id: pet1Created.id,
        name: "zeus",
        type: "lizard",
        age: null,
        owner: "123abc",
      };
      chai
        .request(app)
        .put(`/api/pets/${pet1Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("update(put) pet1, should responds pet1 updated successfully", (done) => {
      const pet = {
        id: pet1Created.id,
        name: "zeus",
        type: "lizard",
        age: null,
        owner: person2Created.id,
      };
      chai
        .request(app)
        .put(`/api/pets/${pet1Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].name).to.be.eql(pet.name);
          expect(res.body.data[0].type).to.be.eql(pet.type);
          expect(res.body.data[0].age).to.be.eql(pet.age);
          expect(res.body.data[0].owner).to.be.eql(pet.owner);
          pet1Created = res.body.data[0];
          done();
        });
    });
    it("get person2 using pet1.owner, should responds success, and person2's pets field should contains pet1 ", (done) => {
      chai
        .request(app)
        .get(`/api/people/${pet1Created.owner}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].pets).to.include(pet1Created.id);
          person2Created = res.body.data[0];
          done();
        });
    });
    it("update(put) pet2, should responds pet2 updated successfully", (done) => {
      const pet = {
        id: pet2Created.id,
        name: "zeus",
        type: "lizard",
        age: null,
        owner: null,
      };
      chai
        .request(app)
        .put(`/api/pets/${pet2Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].name).to.be.eql(pet.name);
          expect(res.body.data[0].type).to.be.eql(pet.type);
          expect(res.body.data[0].age).to.be.eql(pet.age);
          expect(res.body.data[0].owner).to.be.eql(pet.owner);
          pet2Created = res.body.data[0];
          done();
        });
    });
    it("get person1 using person1.id, should responds success, and person1's pets field should not contains pet2 ", (done) => {
      chai
        .request(app)
        .get(`/api/people/${person1Created.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].pets).to.not.include(pet2Created.id);
          person1Created = res.body.data[0];
          done();
        });
    });
  });

  describe("Update(patch) pets", () => {
    it("update(patch) pet1 with wrong format(wrong name format), should responds error", (done) => {
      const pet = {
        id: pet1Created.id,
        name: "",
        type: "lizard",
      };
      chai
        .request(app)
        .patch(`/api/pets/${pet1Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("update(patch) pet1 with wrong format(wrong age format), should responds error", (done) => {
      const pet = {
        id: pet1Created.id,
        name: "ali alibu",
        type: "flying bat",
        age: -1,
        owner: person2Created.id,
      };
      chai
        .request(app)
        .patch(`/api/pets/${pet1Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("update(patch) pet1 with non-exist owner, should responds error", (done) => {
      const pet = {
        id: pet1Created.id,
        name: "zeus",
        type: "lizard",
        age: null,
        owner: "123abc",
      };
      chai
        .request(app)
        .patch(`/api/pets/${pet1Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("update(patch) pet1 (name), should responds pet1 updated successfully", (done) => {
      const pet = {
        id: pet1Created.id,
        name: "hello kitty",
      };
      chai
        .request(app)
        .patch(`/api/pets/${pet1Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].name).to.be.eql(pet.name);
          expect(res.body.data[0].type).to.be.eql(pet1Created.type);
          expect(res.body.data[0].age).to.be.eql(pet1Created.age);
          expect(res.body.data[0].owner).to.be.eql(pet1Created.owner);
          pet1Created = res.body.data[0];
          done();
        });
    });
    it("update(patch) pet1 (owner), should responds pet1 updated successfully", (done) => {
      const pet = {
        id: pet1Created.id,
        owner: person1Created.id,
      };
      chai
        .request(app)
        .patch(`/api/pets/${pet1Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].name).to.be.eql(pet1Created.name);
          expect(res.body.data[0].type).to.be.eql(pet1Created.type);
          expect(res.body.data[0].age).to.be.eql(pet1Created.age);
          expect(res.body.data[0].owner).to.be.eql(pet.owner);
          pet1Created = res.body.data[0];
          done();
        });
    });
    it("get person2(prior owner of pet1) using person2.id, should responds success, and person2's pets field should not contains pet1 ", (done) => {
      chai
        .request(app)
        .get(`/api/people/${person2Created.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].pets).to.not.include(pet1Created.id);
          person2Created = res.body.data[0];
          done();
        });
    });
    it("get person1(new owner) using pet1.owner, should responds success, and person1's pets field should contains pet1 ", (done) => {
      chai
        .request(app)
        .get(`/api/people/${pet1Created.owner}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].pets).to.include(pet1Created.id);
          person1Created = res.body.data[0];
          done();
        });
    });
    it("update(patch) pet2, should responds pet2 updated successfully", (done) => {
      const pet = {
        id: pet2Created.id,
        age: 34,
        owner: null,
      };
      chai
        .request(app)
        .patch(`/api/pets/${pet2Created.id}`)
        .send(pet)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].name).to.be.eql(pet2Created.name);
          expect(res.body.data[0].type).to.be.eql(pet2Created.type);
          expect(res.body.data[0].age).to.be.eql(pet.age);
          expect(res.body.data[0].owner).to.be.eql(pet.owner);
          pet2Created = res.body.data[0];
          done();
        });
    });
    it("get person1 using person1.id, should responds success, and person1's pets field should not contains pet2 ", (done) => {
      chai
        .request(app)
        .get(`/api/people/${person1Created.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].pets).to.not.include(pet2Created.id);
          person1Created = res.body.data[0];
          done();
        });
    });
  });

  describe("Delete method", () => {
    it("delete pet with a non-exist pet.id, should response with error", (done) => {
      chai
        .request(app)
        .delete(`/api/pets/abc123`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
    it("delete pet1, should response success", (done) => {
      chai
        .request(app)
        .delete(`/api/pets/${pet1Created.id}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.a("array");
          expect(res.body.data.length).to.be.eql(1);
          expect(res.body.data[0].id).to.be.eql(pet1Created.id);
          expect(res.body.data[0].name).to.be.eql(pet1Created.name);
          expect(res.body.data[0].type).to.be.eql(pet1Created.type);
          expect(res.body.data[0].age).to.be.eql(pet1Created.age);
          expect(res.body.data[0].owner).to.be.eql(pet1Created.owner);
          done();
        });
    });
    it("get pet1 with prior pet1.id, should responds with error because pet1 is deleted", (done) => {
      chai
        .request(app)
        .get(`/api/pets/${pet1Created.id}`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.data).to.be.undefined;
          done();
        });
    });
  });
});
