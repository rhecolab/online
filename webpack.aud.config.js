const path = require('path');

module.exports = {
  mode: 'production',   // use 'development' while debugging if you want

  // Entry file for this task
  entry: './projs/blink/tasks/aud/audBlink.js',

  // Output bundle
  output: {
    filename: 'audBlink_bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'audBlinkTask',   // exposes functions globally (optional but good)
  },

  // Allows importing HTML files into JS
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: 'raw-loader',
      },
    ],
  },
};
