import app from './app.js';

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`Relay Notes API listening on port ${port}`);
});

export default server;
