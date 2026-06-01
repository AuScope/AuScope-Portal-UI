/// <reference types="node" />

/**
 * AuScope Portal — Live Layer E2E Browser Test
 *
 * Uses Playwright (headless Chromium) to open the AuScope Portal website, navigate
 * the Browse panel, click "Add" for every WMS layer discovered via getKnownLayers.do,
 * verify the layer appears in the Active Layers sidebar, and verify that the layer
 * tiles finish loading on the map without errors.
 *
 * Run with:
 *   ts-node --skip-project src/test/live-layer-e2e.ts [options]
 *
 * Options:
 *   --env dev|prod        Portal environment (default: dev)
 *   --concurrency N       Max parallel browser contexts (default: 3)
 *   --timeout N           Per-action timeout in ms (default: 20000)
 *   --layer <id>          Test only a specific layer ID
 *   --failfast            Stop on first failure
 *   --headed              Show browser window (default: headless)
 */

import { chromium, BrowserContext, Browser } from 'playwright';

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

interface E2EResult {
  layerId: string;
  layerName: string;
  group: string;
  outcome: 'PASS' | 'FAIL' | 'SKIP';
  durationMs: number;
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

function parseArgs() {
  const args = process.argv.slice(2);
  const get  = (flag: string): string | undefined => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : undefined; };
  const has  = (flag: string): boolean => args.includes(flag);

  const envArg = (get('--env') ?? 'dev') as 'dev' | 'prod';
  const apiUrls: Record<string, string> = {
    dev:  'https://auportal-dev.geoanalytics.group/api/',
    prod: 'https://portal.auscope.org.au/api/',
  };
  const portalUrls: Record<string, string> = {
    dev:  'https://auportal-dev.geoanalytics.group/',
    prod: 'https://portal.auscope.org.au/',
  };

  const concurrencyArg = parseInt(get('--concurrency') ?? '3', 10);
  const timeoutArg     = parseInt(get('--timeout')     ?? '20000', 10);

  return {
    env:         envArg,
    apiBaseUrl:  apiUrls[envArg]    ?? apiUrls['dev'],
    portalUrl:   portalUrls[envArg] ?? portalUrls['dev'],
    concurrency: isNaN(concurrencyArg) ? 3     : concurrencyArg,
    timeout:     isNaN(timeoutArg)     ? 20000 : timeoutArg,
    layerFilter: get('--layer') ?? null,
    failfast:    has('--failfast'),
    headed:      has('--headed'),
  };
}

// ─── CSS selector escaping ────────────────────────────────────────────────

/** Minimal CSS attribute value escape: replaces backslashes and double-quotes. */
function cssEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as T;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Concurrency semaphore ─────────────────────────────────────────────────

function createSemaphore(limit: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  function release() {
    active--;
    if (queue.length > 0) { active++; (queue.shift()!)(); }
  }

  return async function acquire<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => task().then(v => { release(); resolve(v); }, e => { release(); reject(e); });
      if (active < limit) { active++; run(); } else { queue.push(run); }
    });
  };
}

// ─── Formatting helpers ────────────────────────────────────────────────────

function pad(s: string, len: number): string { return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length); }
function trunc(s: string, len: number): string { return s.length > len ? s.slice(0, len - 1) + '…' : s; }

const DIVIDER = '─'.repeat(90);

function formatResult(r: E2EResult): string {
  const icon =
    r.outcome === 'PASS' ? `${GREEN}✅${RESET}` :
    r.outcome === 'FAIL' ? `${RED}❌${RESET}`   :
                           `${YELLOW}⏭ ${RESET}`;
  const id    = trunc(r.layerId,   30);
  const name  = trunc(r.layerName, 30);
  const group = trunc(r.group,     24);
  const time  = r.durationMs > 0 ? `${r.durationMs}ms` : '';
  const extra = r.errorMessage ? `  ${RED}${r.errorMessage}${RESET}` : '';
  return `  ${icon} ${pad(id, 30)}  ${pad(name, 30)}  ${pad(group, 24)}  ${time}${extra}`;
}

// ─── Browser test for a single layer ──────────────────────────────────────

/**
 * Opens a fresh browser context, navigates to the portal, clicks Browse,
 * selects the layer's group, clicks the layer's "Add" button, verifies
 * the layer appears in the Active Layers sidebar, and verifies that the
 * layer tiles finish loading on the map without errors.
 */
async function testLayerViaUI(
  browser: Browser,
  layer: Layer,
  portalUrl: string,
  timeoutMs: number,
  headed: boolean,
): Promise<E2EResult> {
  const start = Date.now();
  let context: BrowserContext | null = null;

  try {
    context = await browser.newContext({
      // Reasonable viewport so all UI elements are visible
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);
    page.setDefaultNavigationTimeout(timeoutMs);

    // 1. Navigate to the portal
    await page.goto(portalUrl, { waitUntil: 'networkidle' });

    // 2. Open the Browse panel
    await page.click('button.browse-menu-button');

    // 3. Wait for the browse menu to appear
    await page.waitForSelector('.browse-menu', { state: 'visible' });

    // 4. Click the layer's group name in the groups column
    //    Groups are rendered as <span class="truncate-grp" title="<group>">
    const groupSelector = `.truncate-grp[title="${cssEscape(layer.group)}"]`;
    await page.waitForSelector(groupSelector, { state: 'visible' });
    await page.click(groupSelector);

    // 5. Wait for the layers column to populate with this group's layers
    //    The layer should appear as a span with title matching the layer name
    const layerSpanSelector = `span.truncate-layer[title="${cssEscape(layer.name)}"]`;
    await page.waitForSelector(layerSpanSelector, { state: 'visible' });

    // 6. Find the Add button for this specific layer.
    //    The Add button is the sibling button within the same .col container as the layer span.
    //    We locate the layer's anchor wrapper, then find the Add button within it.
    const addButtonSelector = `a.layer-item-wrapper:has(span.truncate-layer[title="${cssEscape(layer.name)}"]) button[title="Click to add layer"]`;

    // Check whether the Add button is present (it's absent for non-CSW layers)
    const addButton = await page.$(addButtonSelector);
    if (!addButton) {
      // Layer exists in the panel but has no Add button (ban icon instead) — skip
      return {
        layerId:     layer.id,
        layerName:   layer.name,
        group:       layer.group,
        outcome:     'SKIP',
        durationMs:  Date.now() - start,
        errorMessage: 'No Add button (layer not directly addable via browse panel)',
      };
    }

    await addButton.click();

    // 7. Verify the layer appears in the Active Layers sidebar
    //    The sidebar contains .activeLayerTitle elements with the layer name
    await page.waitForFunction(
      (name: string) => {
        const titles = Array.from((document as Document).querySelectorAll('.activeLayerTitle'));
        return titles.some(el => (el as Element).textContent?.trim() === name);
      },
      layer.name,
      { timeout: timeoutMs },
    );

    // 8. Verify the layer was loaded on the map.
    //    The Active Layers panel exposes render state via two DOM signals:
    //      • .delete-button   — shown only after renderStarted=true (tile requests sent)
    //      • .fa-spin.fa-spinner — shown while renderComplete=false (tiles still loading)
    //      • .fa-warning.text-warning — shown if a map loading error occurred

    // 8a. Wait for render to start (delete button appears → renderStarted=true)
    await page.waitForFunction(
      (name: string) => {
        const items = Array.from((document as Document).querySelectorAll('.activeLayerItem'));
        const layerItem = items.find(el =>
          el.querySelector('.activeLayerTitle')?.textContent?.trim() === name
        );
        return !!layerItem?.querySelector('button.delete-button');
      },
      layer.name,
      { timeout: timeoutMs },
    );

    // 8b. Wait for render to complete (spinner disappears → renderComplete=true)
    await page.waitForFunction(
      (name: string) => {
        const items = Array.from((document as Document).querySelectorAll('.activeLayerItem'));
        const layerItem = items.find(el =>
          el.querySelector('.activeLayerTitle')?.textContent?.trim() === name
        );
        if (!layerItem) return false;
        return !layerItem.querySelector('.fa-spin.fa-spinner');
      },
      layer.name,
      { timeout: timeoutMs },
    );

    // 8c. Assert no map loading error was reported
    const hasMapError = await page.evaluate(
      (name: string) => {
        const items = Array.from((document as Document).querySelectorAll('.activeLayerItem'));
        const layerItem = items.find(el =>
          el.querySelector('.activeLayerTitle')?.textContent?.trim() === name
        );
        return !!layerItem?.querySelector('.fa-warning.text-warning');
      },
      layer.name,
    );

    if (hasMapError) {
      throw new Error('Layer appeared in Active Layers but reported a map loading error');
    }

    return {
      layerId:    layer.id,
      layerName:  layer.name,
      group:      layer.group,
      outcome:    'PASS',
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      layerId:      layer.id,
      layerName:    layer.name,
      group:        layer.group,
      outcome:      'FAIL',
      durationMs:   Date.now() - start,
      errorMessage: err?.message?.split('\n')[0] ?? String(err),
    };
  } finally {
    if (context) {
      await context.close().catch(() => { /* ignore close errors */ });
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs();
  const overallStart = Date.now();

  console.log(`\n${BOLD}AuScope Portal — Live Layer E2E Browser Test${RESET}`);
  console.log(`Environment : ${CYAN}${opts.env}${RESET}  (${opts.portalUrl})`);
  console.log(`Concurrency : ${opts.concurrency}    Timeout: ${opts.timeout}ms`);
  if (opts.layerFilter) console.log(`Layer filter: ${opts.layerFilter}`);
  if (opts.headed) console.log(`Browser     : headed (visible)`);
  console.log();

  // 1. Fetch getKnownLayers.do
  process.stdout.write(`Fetching getKnownLayers.do ...  `);
  let layers: Layer[] = [];
  try {
    const resp = await fetchJson<{ data: Layer[] }>(`${opts.apiBaseUrl}getKnownLayers.do`, opts.timeout);
    layers = resp.data ?? [];
    console.log(`${GREEN}${layers.length} layers found${RESET}`);
  } catch (err: any) {
    console.error(`${RED}FAILED — ${err.message ?? String(err)}${RESET}`);
    process.exit(1);
  }

  // 2. Apply layer filter
  if (opts.layerFilter) {
    layers = layers.filter(l => l.id === opts.layerFilter);
    if (layers.length === 0) {
      console.error(`${RED}No layer found with id "${opts.layerFilter}"${RESET}`);
      process.exit(1);
    }
  }

  // 3. Keep only layers that have at least one WMS online resource
  const wmsLayers = layers.filter(layer =>
    (layer.cswRecords ?? []).some(rec =>
      (rec.onlineResources ?? []).some(r => (r.type ?? '').toUpperCase() === 'WMS'),
    ),
  );
  const skippedCount = layers.length - wmsLayers.length;

  console.log(`WMS layers to test: ${wmsLayers.length}  (${skippedCount} layers have no WMS resources — skipped)\n`);

  if (wmsLayers.length === 0) {
    console.log(`${YELLOW}Nothing to test.${RESET}`);
    process.exit(0);
  }

  // 4. Launch browser
  const browser = await chromium.launch({ headless: !opts.headed });

  // 5. Print header
  console.log(DIVIDER);
  console.log(`  ${pad('LAYER ID', 30)}  ${pad('NAME', 30)}  ${pad('GROUP', 24)}  TIME`);
  console.log(DIVIDER);

  // 6. Run tests with concurrency
  const results: E2EResult[] = [];
  let failCount   = 0;
  let earlyExit   = false;

  const acquire = createSemaphore(opts.concurrency);

  await Promise.all(
    wmsLayers.map(layer =>
      acquire(async () => {
        if (earlyExit) {
          const r: E2EResult = { layerId: layer.id, layerName: layer.name, group: layer.group, outcome: 'SKIP', durationMs: 0 };
          results.push(r);
          console.log(formatResult(r));
          return;
        }

        const r = await testLayerViaUI(browser, layer, opts.portalUrl, opts.timeout, opts.headed);
        results.push(r);
        console.log(formatResult(r));

        if (r.outcome === 'FAIL') {
          failCount++;
          if (opts.failfast) earlyExit = true;
        }
      }),
    ),
  );

  await browser.close();

  // 7. Summary
  const totalElapsed = ((Date.now() - overallStart) / 1000).toFixed(1);
  const passCount    = results.filter(r => r.outcome === 'PASS').length;
  const skipCount    = results.filter(r => r.outcome === 'SKIP').length;

  console.log(DIVIDER);
  console.log(`${BOLD}SUMMARY${RESET}`);
  console.log(`  Total layers from getKnownLayers  : ${layers.length}`);
  console.log(`  WMS layers tested via browser     : ${wmsLayers.length}`);
  console.log(`  Passed                            : ${passCount}`);
  console.log(`  Failed                            : ${failCount}`);
  console.log(`  Skipped (failfast / no Add btn)   : ${skipCount}`);
  console.log(`  Layers with no WMS (skipped)      : ${skippedCount}`);
  console.log(`  Total elapsed                     : ${totalElapsed}s`);
  console.log(DIVIDER);

  if (failCount === 0) {
    console.log(`${GREEN}${BOLD}Result: PASSED${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}Result: FAILED (${failCount} layer${failCount !== 1 ? 's' : ''} failed)${RESET}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${RED}Unexpected error: ${err?.message ?? String(err)}${RESET}`);
  process.exit(1);
});
