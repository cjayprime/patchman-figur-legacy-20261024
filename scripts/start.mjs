import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const [mode, ...args] = process.argv.slice(2);
if (mode !== 'dev' && mode !== 'start') {
  throw new Error('Expected dev or start');
}
const environment = mode === 'dev' ? 'development' : 'production';
const env = { ...process.env, NODE_ENV: environment };
const next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), mode, ...args], {
  env,
  stdio: ['inherit', 'pipe', 'inherit'],
  windowsHide: true,
});
let seed;
let output = '';
let started = false;
next.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  output = (output + chunk.toString()).slice(-8192);
  if (!started && /ready in/i.test(output)) {
    started = true;
    seed = spawn(
      process.execPath,
      [
        require.resolve('sequelize-cli/lib/sequelize'),
        'db:seed:all',
        '--config',
        'lib/database/config.cjs',
        '--seeders-path',
        'seeders',
        '--env',
        environment,
      ],
      { env, stdio: 'inherit', windowsHide: true },
    );
    seed.on('error', (error) => console.error('[seed] Unable to launch:', error.message));
    seed.on('exit', (code) => {
      if (code !== 0) {
        console.error('[seed] Failed with exit code', code);
      }
    });
  }
});
next.on('error', (error) => {
  console.error('[next] Unable to launch:', error.message);
  process.exitCode = 1;
});
next.on('exit', (code, signal) => {
  if (seed && seed.exitCode === null) {
    seed.kill();
  }
  process.exitCode = code ?? (signal ? 1 : 0);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    next.kill(signal);
    if (seed && seed.exitCode === null) {
      seed.kill(signal);
    }
  });
}
