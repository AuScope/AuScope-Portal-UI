/**
 * Chart library globals setup.
 *
 * d3 (v3) and Rickshaw are legacy UMD libraries that the app and the
 * src/extension/js/* plugin scripts consume as GLOBALS (window.d3 /
 * window.Rickshaw). Under the esbuild-based @angular/build builder, loading
 * them via the angular.json "scripts" array makes their UMD wrappers take the
 * CommonJS branch (because module/exports are present in that scope), so the
 * browser globals were never set — causing "TypeError: M is not a function"
 * inside Rickshaw. We instead import them here and attach the globals
 * explicitly, then load the extension plugins which augment those globals.
 */
// @ts-expect-error legacy JS library without type declarations
import * as d3 from 'd3';
// @ts-expect-error legacy JS library without type declarations
import * as Rickshaw from 'rickshaw';

// Expose as globals BEFORE the plugin scripts run.
(window as any).d3 = (d3 as any).default ?? d3;
(window as any).Rickshaw = (Rickshaw as any).default ?? Rickshaw;

/**
 * Load the extension chart plugins. These are plain scripts that reference the
 * d3 / Rickshaw globals at evaluation time, so they must run only AFTER the
 * assignments above. Dynamic import guarantees that order (static imports are
 * hoisted above statements and would run too early).
 */
export async function loadChartExtensions(): Promise<void> {
  await import('./extension/js/box.js' as any);
  await import('./extension/js/d3.legend.js' as any);
  await import('./extension/js/Rickshaw.Graph.RangeSlider.MultiPreview.min.js' as any);
  await import('./extension/js/Rickshaw.Graph.SmootherPlus.min.js' as any);
}
