module.exports = {
  resolve: {
      fallback: {
      fs: false,
      Buffer: false,
      http: false,
      https: false,
      zlib: false
    },
  },
  cache: false,
  module: {
    unknownContextCritical: false
  }
};
