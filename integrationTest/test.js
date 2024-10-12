const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server'); // Adjust the path to your server file
const expect = chai.expect;

chai.use(chaiHttp);

describe('Server Route Testing', function () {
  before(function () {
    console.log('Before tests');
  });

  after(function () {
    console.log('After tests');
  });

  // Example: Testing a GET request
  describe('GET /api/groups', function () {
    it('should return all groups', function (done) {
      chai.request(server)
        .get('/api/groups') // Adjust the endpoint to match your API
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array'); // Assuming the API returns an array of groups
          done();
        });
    });
  });

  // Example: Testing a POST request
  describe('POST /api/login', function () {
    it('should log in the user and return a token', function (done) {
      chai.request(server)
        .post('/api/login') // Adjust the endpoint to match your login route
        .send({ username: 'testuser', password: 'password' })
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('token'); // Assuming the response includes a token
          done();
        });
    });
  });
});
