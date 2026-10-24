const serverlessExpress = require('@codegenie/serverless-express');
const { config, assertAuthConfig } = require('./src/config');
const { createApp } = require('./src/app');

assertAuthConfig();

const app = createApp();
const serverlessExpressInstance = serverlessExpress({ app });

exports.handler = (event, context) => {
  return serverlessExpressInstance(event, context);
};
