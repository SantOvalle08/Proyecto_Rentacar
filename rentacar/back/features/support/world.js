const { setWorldConstructor, World } = require('@cucumber/cucumber');
const request = require('supertest');
const app = require('../../tests/setup/testApp');

class RentaCarWorld extends World {
  constructor(options) {
    super(options);
    this.app = app;
    this.response = null;
    this.token = null;
    this.adminToken = null;
    this.clienteToken = null;
    this.lastCreatedId = null;
  }

  async get(path, token) {
    const req = request(this.app).get(path);
    if (token) req.set('Authorization', `Bearer ${token}`);
    this.response = await req;
    return this.response;
  }

  async post(path, body, token) {
    const req = request(this.app).post(path).send(body);
    if (token) req.set('Authorization', `Bearer ${token}`);
    this.response = await req;
    return this.response;
  }

  async put(path, body, token) {
    const req = request(this.app).put(path).send(body || {});
    if (token) req.set('Authorization', `Bearer ${token}`);
    this.response = await req;
    return this.response;
  }

  async delete(path, token) {
    const req = request(this.app).delete(path);
    if (token) req.set('Authorization', `Bearer ${token}`);
    this.response = await req;
    return this.response;
  }
}

setWorldConstructor(RentaCarWorld);
