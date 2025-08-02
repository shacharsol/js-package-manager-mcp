// This creates a circular dependency with moduleA
const moduleA = require('./moduleA');

function getName() {
  return 'Module B';
}

function callA() {
  return moduleA.getName();
}

module.exports = {
  getName,
  callA
};