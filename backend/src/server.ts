import { createApp } from './app.js';
import { env } from './config/env.js';

createApp().listen(env.port, () => {
  console.log(`Backend escuchando en http://localhost:${env.port}`);
});
