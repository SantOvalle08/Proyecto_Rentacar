const { Before, After, BeforeAll, AfterAll } = require('@cucumber/cucumber');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'secretkey';

let mongod;

BeforeAll(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongod.getUri());
}, 60000);

AfterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

Before(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
