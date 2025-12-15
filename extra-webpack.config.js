module.exports = {
  resolve: {
      fallback: {
      fs: false,
      Buffer: false,
      http: false,
      https: false,
      zlib: false,
      url: false
    },
  },
  cache: false,
  module: {
    unknownContextCritical: false
  }
};
