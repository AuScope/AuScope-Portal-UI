/// <reference types="node" />

/**
 * AuScope Portal — Live Layer Integration Test
 *
 * Standalone Node.js script (no Angular, no third-party deps beyond ts-node).
 * Run with:
 *   ts-node --skipProject src/test/live-layer-integration.ts [options]
 *
 * Options:
 *   --env dev|prod        Portal environment (default: dev)
 *   --concurrency N       Max parallel requests (default: 5)
 *   --timeout N           Per-request timeout in ms (default: 15000)
 *   --type wms|wfs|all    Service type to test (default: all)
 *   --layer <id>          Test only a specific layer ID
 *   --failfast            Stop on first failure
 */

// ─── Types ─────────────────────────────────────────────────────────────────

interface OnlineResource {
  type: string;
  url: string;
  name: string;
}

interface CswRecord {
  name: string;
  onlineResources: OnlineResource[];
}

interface Layer {
  id: string;
  name: string;
  group: string;
  cswRecords: CswRecord[];
}

interface TestResult {
  layerId: string;
  layerName: string;
  serviceType: string;
  url: string;
  httpStatus: number | string;
  responseTimeMs: number;
  outcome: 'PASS' | 'FAIL' | 'SKIP';
  errorMessage?: string;
}

// ─── ANSI colours ──────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

// ─── CLI argument parsing ──────────────────────────────────────────────────

function parseArgs(): {
  env: 'dev' | 'prod';
  baseUrl: string;
  concurrency: number;
  timeout: number;
  type: 'wms' | 'wfs' | 'all';
  layerFilter: string | null;
  failfast: boolean;
} {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };
  const has = (flag: string): boolean => args.includes(flag);

  const envArg = (get('--env') ?? 'dev') as 'dev' | 'prod';
  const envUrls: Record<string, string> = {
    dev:  'https://auportal-dev.geoanalytics.group/api/',
    prod: 'https://portal.auscope.org.au/api/',
  };
  const baseUrl = envUrls[envArg] ?? envUrls['dev'];

  const concurrencyArg = parseInt(get('--concurrency') ?? '5', 10);
  const timeoutArg     = parseInt(get('--timeout')     ?? '15000', 10);
  const typeArg        = (get('--type') ?? 'all') as 'wms' | 'wfs' | 'all';
  const layerFilter    = get('--layer') ?? null;
  const failfast       = has('--failfast');

  return {
    env: envArg,
    baseUrl,
    concurrency: isNaN(concurrencyArg) ? 5     : concurrencyArg,
    timeout:     isNaN(timeoutArg)     ? 15000 : timeoutArg,
    type:        typeArg,
    layerFilter,
    failfast,
  };
}

// ─── HTTP fetch with timeout ───────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.text();
    return { status: response.status, body };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── URL query-string appending ────────────────────────────────────────────

function appendQueryParams(base: string, params: Record<string, string>): string {
  const separator = base.includes('?') ? '&' : '?';
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${base}${separator}${qs}`;
}

// ─── WMS GetCapabilities test ──────────────────────────────────────────────

async function testWMS(
  url: string,
  timeoutMs: number,
): Promise<{ httpStatus: number | string; responseTimeMs: number; outcome: 'PASS' | 'FAIL'; errorMessage?: string }> {
  const reqUrl = appendQueryParams(url, {
    SERVICE: 'WMS',
    REQUEST: 'GetCapabilities',
    VERSION: '1.3.0',
  });
  const start = Date.now();
  try {
    const { status, body } = await fetchWithTimeout(reqUrl, timeoutMs);
    const elapsed = Date.now() - start;
    if (status !== 200) {
      return { httpStatus: status, responseTimeMs: elapsed, outcome: 'FAIL', errorMessage: `HTTP ${status}` };
    }
    const valid = body.includes('WMS_Capabilities') || body.includes('WMT_MS_Capabilities');
    if (!valid) {
      return { httpStatus: status, responseTimeMs: elapsed, outcome: 'FAIL', errorMessage: 'Invalid capabilities response' };
    }
    return { httpStatus: status, responseTimeMs: elapsed, outcome: 'PASS' };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    if (err.code === 'TIMEOUT') {
      return { httpStatus: 'TIMEOUT', responseTimeMs: elapsed, outcome: 'FAIL', errorMessage: 'Request timed out' };
    }
    return { httpStatus: 'ERROR', responseTimeMs: elapsed, outcome: 'FAIL', errorMessage: err.message ?? String(err) };
  }
}

// ─── WFS DescribeFeatureType test ─────────────────────────────────────────

async function testWFS(
  url: string,
  timeoutMs: number,
): Promise<{ httpStatus: number | string; responseTimeMs: number; outcome: 'PASS' | 'FAIL'; errorMessage?: string }> {
  const reqUrl = appendQueryParams(url, {
    SERVICE: 'WFS',
    REQUEST: 'DescribeFeatureType',
    VERSION: '2.0.0',
  });
  const start = Date.now();
  try {
    const { status, body } = await fetchWithTimeout(reqUrl, timeoutMs);
    const elapsed = Date.now() - start;
    if (status !== 200) {
      return { httpStatus: status, responseTimeMs: elapsed, outcome: 'FAIL', errorMessage: `HTTP ${status}` };
    }
    const valid = body.includes('<schema') || body.includes('<xsd:schema') || body.includes('<xs:schema');
    if (!valid) {
      return { httpStatus: status, responseTimeMs: elapsed, outcome: 'FAIL', errorMessage: 'Invalid schema response' };
    }
    return { httpStatus: status, responseTimeMs: elapsed, outcome: 'PASS' };
  } catch (err: any) {
    const elapsed = Date.now() - start;
    if (err.code === 'TIMEOUT') {
      return { httpStatus: 'TIMEOUT', responseTimeMs: elapsed, outcome: 'FAIL', errorMessage: 'Request timed out' };
    }
    return { httpStatus: 'ERROR', responseTimeMs: elapsed, outcome: 'FAIL', errorMessage: err.message ?? String(err) };
  }
}

// ─── Concurrency semaphore ─────────────────────────────────────────────────

function createSemaphore(limit: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  function release() {
    active--;
    if (queue.length > 0) {
      const next = queue.shift()!;
      active++;
      next();
    }
  }

  return async function acquire<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        task().then(
          (v) => { release(); resolve(v); },
          (e) => { release(); reject(e); },
        );
      };
      if (active < limit) {
        active++;
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

// ─── Formatting helpers ────────────────────────────────────────────────────

function pad(s: string, len: number): string {
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

function truncate(s: string, len: number): string {
  return s.length > len ? s.slice(0, len - 1) + '…' : s;
}

function formatResult(r: TestResult): string {
  const icon =
    r.outcome === 'PASS' ? `${GREEN}✅${RESET}` :
    r.outcome === 'FAIL' ? `${RED}❌${RESET}`   :
                           `${YELLOW}⏭ ${RESET}`;

  const layerId   = truncate(r.layerId,   32);
  const layerName = truncate(r.layerName, 26);
  const svcType   = pad(r.serviceType === '' ? '-' : r.serviceType, 5);
  const url       = r.url ? truncate(r.url, 36) : '(no WMS/WFS)';
  const status    = String(r.httpStatus === 0 ? 'SKIP' : r.httpStatus);
  const time      = r.responseTimeMs > 0 ? `${r.responseTimeMs}ms` : '';
  const extra     = r.errorMessage ? `  ${RED}${r.errorMessage}${RESET}` : '';

  return `  ${icon} ${pad(layerId, 32)}  ${pad(layerName, 26)}  ${svcType}  ${pad(url, 36)}  ${pad(status, 10)}  ${time}${extra}`;
}

const DIVIDER = '─'.repeat(100);

// ─── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs();
  const startTime = Date.now();

  console.log(`\n${BOLD}AuScope Portal — Live Layer Integration Test${RESET}`);
  console.log(`Environment : ${CYAN}${opts.env}${RESET}  (${opts.baseUrl})`);
  console.log(`Concurrency : ${opts.concurrency}    Timeout: ${opts.timeout}ms   Filter: ${opts.type}`);
  if (opts.layerFilter) console.log(`Layer filter: ${opts.layerFilter}`);
  console.log();

  // 1. Fetch getKnownLayers.do
  const knownLayersUrl = `${opts.baseUrl}getKnownLayers.do`;
  process.stdout.write(`Fetching getKnownLayers.do ...  `);

  let layers: Layer[] = [];
  try {
    const { status, body } = await fetchWithTimeout(knownLayersUrl, opts.timeout);
    if (status !== 200) {
      console.error(`${RED}FAILED — HTTP ${status}${RESET}`);
      process.exit(1);
    }
    const parsed = JSON.parse(body) as { data: Layer[] };
    layers = parsed.data ?? [];
    console.log(`${GREEN}${layers.length} layers found${RESET}`);
  } catch (err: any) {
    console.error(`${RED}FAILED — ${err.message ?? String(err)}${RESET}`);
    process.exit(1);
  }

  // 2. Optionally filter to a specific layer
  if (opts.layerFilter) {
    layers = layers.filter((l) => l.id === opts.layerFilter);
    if (layers.length === 0) {
      console.error(`${RED}No layer found with id "${opts.layerFilter}"${RESET}`);
      process.exit(1);
    }
  }

  // 3. Build test tasks
  interface TestTask {
    layerId: string;
    layerName: string;
    serviceType: 'WMS' | 'WFS';
    url: string;
  }

  const tasks: TestTask[] = [];
  const skippedLayers: Layer[] = [];

  for (const layer of layers) {
    const wmsUrls = new Set<string>();
    const wfsUrls = new Set<string>();

    for (const cswRecord of (layer.cswRecords ?? [])) {
      for (const res of (cswRecord.onlineResources ?? [])) {
        const t = (res.type ?? '').toUpperCase();
        if (t === 'WMS' && res.url) wmsUrls.add(res.url);
        if (t === 'WFS' && res.url) wfsUrls.add(res.url);
      }
    }

    const includeWMS = opts.type === 'all' || opts.type === 'wms';
    const includeWFS = opts.type === 'all' || opts.type === 'wfs';

    let hasTask = false;

    if (includeWMS) {
      for (const url of wmsUrls) {
        tasks.push({ layerId: layer.id, layerName: layer.name, serviceType: 'WMS', url });
        hasTask = true;
      }
    }
    if (includeWFS) {
      for (const url of wfsUrls) {
        tasks.push({ layerId: layer.id, layerName: layer.name, serviceType: 'WFS', url });
        hasTask = true;
      }
    }

    if (!hasTask) {
      skippedLayers.push(layer);
    }
  }

  // 4. Print header
  console.log(DIVIDER);
  console.log(`  ${pad('LAYER ID', 32)}  ${pad('NAME', 26)}  ${pad('TYPE', 5)}  ${pad('URL', 36)}  ${pad('STATUS', 10)}  TIME`);
  console.log(DIVIDER);

  // 5. Print skipped layers first
  for (const layer of skippedLayers) {
    const r: TestResult = {
      layerId: layer.id,
      layerName: layer.name,
      serviceType: '',
      url: '',
      httpStatus: 0,
      responseTimeMs: 0,
      outcome: 'SKIP',
    };
    console.log(formatResult(r));
  }

  // 6. Run test tasks with concurrency control
  const results: TestResult[] = [];
  let hasFailed = false;
  let earlyExit = false;

  const acquire = createSemaphore(opts.concurrency);

  const taskPromises = tasks.map((task) =>
    acquire(async () => {
      if (earlyExit) {
        // If failfast triggered, just record as skipped
        const r: TestResult = {
          layerId:       task.layerId,
          layerName:     task.layerName,
          serviceType:   task.serviceType,
          url:           task.url,
          httpStatus:    'SKIP',
          responseTimeMs: 0,
          outcome:       'SKIP',
        };
        results.push(r);
        console.log(formatResult(r));
        return;
      }

      let outcome: { httpStatus: number | string; responseTimeMs: number; outcome: 'PASS' | 'FAIL'; errorMessage?: string };
      if (task.serviceType === 'WMS') {
        outcome = await testWMS(task.url, opts.timeout);
      } else {
        outcome = await testWFS(task.url, opts.timeout);
      }

      const r: TestResult = {
        layerId:       task.layerId,
        layerName:     task.layerName,
        serviceType:   task.serviceType,
        url:           task.url,
        httpStatus:    outcome.httpStatus,
        responseTimeMs: outcome.responseTimeMs,
        outcome:       outcome.outcome,
        errorMessage:  outcome.errorMessage,
      };
      results.push(r);
      console.log(formatResult(r));

      if (r.outcome === 'FAIL') {
        hasFailed = true;
        if (opts.failfast) {
          earlyExit = true;
        }
      }
    }),
  );

  await Promise.all(taskPromises);

  // 7. Print summary
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  const wmsResults  = results.filter((r) => r.serviceType === 'WMS' && r.outcome !== 'SKIP');
  const wfsResults  = results.filter((r) => r.serviceType === 'WFS' && r.outcome !== 'SKIP');
  const wmsPass     = wmsResults.filter((r) => r.outcome === 'PASS').length;
  const wmsFail     = wmsResults.filter((r) => r.outcome === 'FAIL').length;
  const wfsPass     = wfsResults.filter((r) => r.outcome === 'PASS').length;
  const wfsFail     = wfsResults.filter((r) => r.outcome === 'FAIL').length;
  const totalFailed = wmsFail + wfsFail;

  // Count distinct layers that were actually tested (not skipped)
  const testedLayerIds = new Set(results.filter((r) => r.outcome !== 'SKIP').map((r) => r.layerId));
  const wmsLayerIds    = new Set(wmsResults.map((r) => r.layerId));
  const wfsLayerIds    = new Set(wfsResults.map((r) => r.layerId));

  console.log(DIVIDER);
  console.log(`${BOLD}SUMMARY${RESET}`);
  console.log(`  Layers from getKnownLayers     : ${layers.length}`);
  console.log(`  WMS endpoints tested           : ${wmsResults.length}   passed: ${wmsPass}   failed: ${wmsFail}`);
  console.log(`  WFS endpoints tested           : ${wfsResults.length}   passed: ${wfsPass}   failed: ${wfsFail}`);
  console.log(`  Layers with WMS tested         : ${wmsLayerIds.size}`);
  console.log(`  Layers with WFS tested         : ${wfsLayerIds.size}`);
  console.log(`  Layers skipped (no WMS/WFS)    : ${skippedLayers.length}`);
  console.log(`  Total elapsed                  : ${totalElapsed}s`);
  console.log(DIVIDER);

  if (totalFailed === 0) {
    console.log(`${GREEN}${BOLD}Result: PASSED${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}Result: FAILED (${totalFailed} endpoint${totalFailed !== 1 ? 's' : ''} failed)${RESET}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${RED}Unexpected error: ${err?.message ?? String(err)}${RESET}`);
  process.exit(1);
});
