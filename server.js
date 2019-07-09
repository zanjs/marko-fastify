require('marko/node-require');

const path = require('path');
const fastify = require('fastify')(
  {
    logger: {
      level: 'info',
      file: './pino.log' // will use pino.destination()
    }
  }
);

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

const isProduction = process.env.NODE_ENV === 'production';
const outputDir = path.join(__dirname, 'static');

// Configure lasso to control how JS/CSS/etc. is delivered to the browser
require('lasso').configure({
  plugins: [
    'lasso-marko' // Allow Marko templates to be compiled and transported to the browser
  ],
  outputDir: outputDir, // Place all generated JS/CSS/etc. files into the "static" dir
  bundlingEnabled: isProduction, // Only enable bundling in production
  minify: isProduction, // Only minify JS and CSS code in production
  fingerprintsEnabled: isProduction, // Only add fingerprints to URLs in production
});

fastify.register(require('point-of-view'), {
  engine: {
    marko: require('marko')
  }
});

fastify.register(require('fastify-static'), {
  root: outputDir,
  prefix: '/static'
});

fastify.get('/', (req, reply) => {
  req.log.info('Some info about the current request')
  const ops = JSON.stringify(req.log,getCircularReplacer())
  reply.view('/index.marko', {
    name: 'Frank',
    ops: ops,
    count: 30,
    colors: ['red', 'green', 'blue']
  });
});

fastify.listen(8080, err => {
  if (err) throw err;
  console.log(`Server listening on http://127.0.0.1:${fastify.server.address().port}`);
});
