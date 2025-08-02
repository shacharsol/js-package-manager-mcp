// This creates a circular dependency with moduleB
const moduleB = require('./moduleB');

function getName() {
  return 'Module A';
}

function callB() {
  return moduleB.getName();
}

module.exports = {
  getName,
  callB
};