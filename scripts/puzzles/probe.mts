import { Engine } from '../../src/lib/engine/engine';
import { nodeTransport } from '../../src/lib/engine/node-transport';
import { formatScore } from '../../src/lib/engine/uci';
const e = new Engine(nodeTransport());
for (const fen of process.argv.slice(2)) {
  const r = await e.analyse(fen, { depth: 16, multiPv: 5 });
  console.log(fen);
  for (const l of r.lines) console.log('  ', formatScore(l.scoreWhite), l.pvSan.slice(0, 6).join(' '));
}
e.terminate();
