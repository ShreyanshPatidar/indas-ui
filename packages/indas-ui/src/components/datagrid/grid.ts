// The grid alone, without the chart view: `./index` also exports ChartView, which brings all of
// echarts (about 360 KB) into any app that loads the grid, charts used or not. Apps that lazy-load
// the grid import this entry; the chart view stays behind the grid's own lazy import.
export { DataGrid } from './DataGrid'
export type { DataGridProps } from './DataGrid'
