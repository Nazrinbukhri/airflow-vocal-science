import { Chess, type Color } from 'chess.js';
import { parseBestMove, parseInfo, pvToSan, scoreValue, toWhite, type InfoLine, type Score } from './uci';

/** How the engine is reached: a Web Worker in the browser, the npm engine in Node tests. */
export interface Transport {
  send(command: string): void;
  /** Register the single line listener. */
  listen(onLine: (line: string) => void, onError: (message: string) => void): void;
  terminate(): void;
}

export type EngineState = 'idle' | 'loading' | 'ready' | 'thinking' | 'error' | 'terminated';

export type EngineLine = {
  multipv: number;
  depth: number;
  /** From the side to move. */
  score: Score;
  /** From White's point of view (for eval bars and "+1.2" display). */
  scoreWhite: Score;
  pv: string[];
  pvSan: string[];
};

export type AnalysisResult = {
  fen: string;
  turn: Color;
  depth: number;
  lines: EngineLine[];
  bestMove: string | null;
  /** True when the search was stopped early (position changed or cancelled). */
  stopped: boolean;
  nodes?: number;
  timeMs?: number;
};

export type SearchLimit = { depth?: number; movetime?: number };

export type AnalyseOptions = SearchLimit & {
  multiPv?: number;
  signal?: AbortSignal;
  onUpdate?: (partial: AnalysisResult) => void;
  /** UCI "Skill Level" 0–20 (20 = full strength). */
  skill?: number;
  /** Only search these moves (UCI), e.g. to evaluate a tempting wrong move. */
  searchMoves?: string[];
};

const DEFAULT_LIMIT: SearchLimit = { depth: 16 };

/**
 * Promise-based UCI client for Stockfish.
 * Searches run one at a time; a newer request (or an AbortSignal) stops the
 * running search with `stop` and waits for its `bestmove` before the next `go`,
 * so engine output can never be attributed to the wrong position.
 */
export class Engine {
  state: EngineState = 'idle';
  name = 'Stockfish';
  error: string | null = null;
  private transport: Transport;
  private waiters: { test: (line: string) => boolean; resolve: (line: string) => void }[] = [];
  private lineHandlers = new Set<(line: string) => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private initPromise: Promise<void> | null = null;
  private options = new Map<string, string>();
  private stateListeners = new Set<(s: EngineState) => void>();

  constructor(transport: Transport) {
    this.transport = transport;
    transport.listen(
      (line) => this.onLine(line),
      (message) => this.fail(message),
    );
  }

  onStateChange(cb: (s: EngineState) => void): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  private setState(s: EngineState) {
    this.state = s;
    for (const cb of this.stateListeners) cb(s);
  }

  private fail(message: string) {
    this.error = message;
    this.setState('error');
    // Release anyone waiting so the UI never hangs.
    const w = this.waiters;
    this.waiters = [];
    for (const x of w) x.resolve('bestmove (none)');
  }

  private onLine(raw: string) {
    const line = raw.trim();
    if (!line) return;
    if (line.startsWith('id name ')) this.name = line.slice(8);
    for (const h of this.lineHandlers) h(line);
    const i = this.waiters.findIndex((w) => w.test(line));
    if (i >= 0) this.waiters.splice(i, 1)[0]!.resolve(line);
  }

  private waitFor(test: (line: string) => boolean): Promise<string> {
    if (this.state === 'error' || this.state === 'terminated') return Promise.resolve('bestmove (none)');
    return new Promise((resolve) => this.waiters.push({ test, resolve }));
  }

  /** Send a command and wait for a matching reply. The waiter is registered first, because an engine may answer synchronously. */
  private request(cmd: string, test: (line: string) => boolean): Promise<string> {
    const reply = this.waitFor(test);
    this.send(cmd);
    return reply;
  }

  private send(cmd: string) {
    if (this.state === 'terminated') return;
    this.transport.send(cmd);
  }

  init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        this.setState('loading');
        await this.request('uci', (l) => l === 'uciok');
        await this.isReady();
        if (this.state !== 'error' && this.state !== 'terminated') this.setState('ready');
      })();
    }
    return this.initPromise;
  }

  private async isReady() {
    await this.request('isready', (l) => l === 'readyok');
  }

  private setOption(name: string, value: string | number) {
    const v = String(value);
    if (this.options.get(name) === v) return;
    this.options.set(name, v);
    this.send(`setoption name ${name} value ${v}`);
  }

  /** Clear hash/history between unrelated games. */
  newGame(): Promise<void> {
    return this.enqueue(async () => {
      await this.init();
      this.send('ucinewgame');
      await this.isReady();
    });
  }

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job, job);
    this.queue = run.catch(() => undefined);
    return run;
  }

  /** Analyse a position. Resolves when the search ends or is stopped. */
  analyse(fen: string, opts: AnalyseOptions = {}): Promise<AnalysisResult> {
    return this.enqueue(() => this.search(fen, opts));
  }

  private async search(fen: string, opts: AnalyseOptions): Promise<AnalysisResult> {
    const chess = new Chess(fen);
    const turn = chess.turn();
    const legalCount = opts.searchMoves?.length ?? chess.moves().length;
    const result: AnalysisResult = { fen, turn, depth: 0, lines: [], bestMove: null, stopped: false };

    if (opts.signal?.aborted) return { ...result, stopped: true };
    await this.init();
    if (this.state === 'error' || this.state === 'terminated') {
      throw new Error(this.error ?? 'Enjin tidak tersedia.');
    }
    if (legalCount === 0) return result; // checkmate or stalemate: nothing to search

    // Up to 5 lines normally; more when evaluating a chosen set of moves (e.g. every move of one piece).
    const multiPv = Math.max(1, Math.min(opts.multiPv ?? 1, opts.searchMoves?.length ? 40 : 5, legalCount));
    this.setOption('MultiPV', multiPv);
    this.setOption('Skill Level', Math.max(0, Math.min(20, Math.round(opts.skill ?? 20))));
    await this.isReady();

    const limit = opts.depth || opts.movetime ? opts : DEFAULT_LIMIT;
    const restrict = opts.searchMoves?.length ? ` searchmoves ${opts.searchMoves.join(' ')}` : '';
    const go = (limit.depth ? `go depth ${limit.depth}` : `go movetime ${limit.movetime}`) + restrict;

    // Collect lines per depth; publish a depth only when all its MultiPV lines arrived.
    let pending = new Map<number, InfoLine>();
    let pendingDepth = 0;
    const commit = () => {
      if (pending.size === 0) return;
      const lines = [...pending.values()]
        .sort((a, b) => a.multipv - b.multipv)
        .map<EngineLine>((l) => ({
          multipv: l.multipv,
          depth: l.depth,
          score: l.score,
          scoreWhite: toWhite(l.score, turn),
          pv: l.pv,
          pvSan: pvToSan(fen, l.pv),
        }))
        // Keep the engine's MultiPV order, but guard against odd partial updates.
        .sort((a, b) => scoreValue(b.score) - scoreValue(a.score));
      // Keep earlier lines if this depth is incomplete (e.g. search stopped mid-depth).
      if (lines.length >= result.lines.length || pendingDepth > result.depth) {
        result.lines = lines;
        result.depth = pendingDepth;
      }
      opts.onUpdate?.({ ...result, lines: [...result.lines] });
    };

    const handler = (line: string) => {
      const info = parseInfo(line);
      if (!info || info.bound) return;
      if (info.nodes) result.nodes = info.nodes;
      if (info.time) result.timeMs = info.time;
      if (info.depth !== pendingDepth) {
        pending = new Map();
        pendingDepth = info.depth;
      }
      pending.set(info.multipv, info);
      if (pending.size >= multiPv) commit();
    };

    const onAbort = () => {
      result.stopped = true;
      this.send('stop');
    };

    if (opts.signal?.aborted) return { ...result, stopped: true };
    this.lineHandlers.add(handler);
    opts.signal?.addEventListener('abort', onAbort, { once: true });
    this.setState('thinking');
    try {
      this.send(`position fen ${fen}`);
      const done = await this.request(go, (l) => l.startsWith('bestmove'));
      if (result.lines.length === 0) commit();
      result.bestMove = parseBestMove(done)?.best ?? result.lines[0]?.pv[0] ?? null;
      return result;
    } finally {
      this.lineHandlers.delete(handler);
      opts.signal?.removeEventListener('abort', onAbort);
      if (this.state === 'thinking') this.setState('ready');
    }
  }

  terminate() {
    if (this.state === 'terminated') return;
    try {
      this.send('quit');
    } catch {
      // ignore
    }
    this.transport.terminate();
    this.setState('terminated');
    const w = this.waiters;
    this.waiters = [];
    for (const x of w) x.resolve('bestmove (none)');
  }
}
