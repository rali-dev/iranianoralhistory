/**
 * Wrapper around `prisma studio` that suppresses the harmless
 * ERR_STREAM_UNABLE_TO_PIPE noise Prisma logs when the browser
 * closes a connection before the response stream finishes.
 */
import { spawn } from 'node:child_process';

const TRIGGER = 'ERR_STREAM_UNABLE_TO_PIPE';

/**
 * State-machine filter: once we see the TRIGGER error, suppress all
 * subsequent stack-trace / closing-brace lines until normal output resumes.
 */
function makeFilter(writeStream) {
  let suppressing = false;
  return (chunk) => {
    const lines = chunk.toString().split('\n');
    const out = [];
    for (const line of lines) {
      if (line.includes(TRIGGER)) {
        suppressing = true;
      }
      if (suppressing) {
        // Stack frames, `code:` property lines, and the closing `}` belong to the block.
        const isBlockLine =
          line.includes(TRIGGER) ||
          /^\s+at /.test(line) ||
          /^\s*code: '/.test(line) ||
          /^\s*\}/.test(line) ||
          line.trim() === '';
        if (!isBlockLine) suppressing = false;
      }
      if (!suppressing) out.push(line);
    }
    const text = out.join('\n');
    if (text.replace(/\n/g, '').length) writeStream.write(text);
  };
}

const child = spawn(
  'node',
  ['node_modules/prisma/build/index.js', 'studio', ...process.argv.slice(2)],
  { stdio: ['inherit', 'pipe', 'pipe'] }
);

child.stdout.on('data', makeFilter(process.stdout));
child.stderr.on('data', makeFilter(process.stderr));
child.on('exit', (code) => process.exit(code ?? 0));
