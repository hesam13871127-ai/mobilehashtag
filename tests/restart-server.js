import { app } from '../backend/server.js';
const server = app.listen(0, '127.0.0.1', () => process.send({ port: server.address().port }));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
