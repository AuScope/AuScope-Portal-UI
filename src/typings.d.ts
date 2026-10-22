/* SystemJS module definition */
declare let module: NodeModule;
interface NodeModule {
  id: string;
}
declare module 'simplify-js';

// Legacy chart libraries without bundled type declarations.
declare module 'd3';
declare module 'rickshaw';

// Side-effect-only extension chart plugin scripts (plain JS, no exports).
declare module '*/extension/js/box.js';
declare module '*/extension/js/d3.legend.js';
declare module '*/extension/js/Rickshaw.Graph.RangeSlider.MultiPreview.min.js';
declare module '*/extension/js/Rickshaw.Graph.SmootherPlus.min.js';
