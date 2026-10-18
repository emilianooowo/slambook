declare module '*.geojson' {
  const content: import('geojson').FeatureCollection;
  export default content;
}
