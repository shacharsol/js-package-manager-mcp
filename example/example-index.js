// Example entry point for testing dependency analysis
const express = require('express');
const _ = require('lodash');
const axios = require('axios');

// Example modules for circular dependency testing
const moduleA = require('./moduleA');
const moduleB = require('./moduleB');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from example project!',
    random: _.random(1, 100),
    modules: {
      a: moduleA.getName(),
      b: moduleB.getName()
    }
  });
});

app.get('/fetch', async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com');
    res.json({ 
      status: 'success',
      github: response.data 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Example server running on port ${PORT}`);
  });
}

module.exports = app;