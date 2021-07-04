process.env['NODE_ENV'] = "production"

const { exit } = require('process')
const { Nuxt, Builder } = require('nuxt')
const options = require('./nuxt.config.js')

const nuxt = new Nuxt(options);

// Clean

// Build Nuxt SPA client
try {
  new Builder(nuxt).build();
} catch(error) {
  logger.error('Error building');
  logger.log({ level: 'error', message: error });
  exit(1)
}

// Build Server
try {
    
  } catch(error) {
    logger.error('Error building');
    logger.log({ level: 'error', message: error });
    exit(1)
  }

// Copy required files



// Package