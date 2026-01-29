const path = require('path');

module.exports = {
  mode: 'production',   // use 'development' while debugging if you want

  // Entry file for this task
  entry: './projs/blink/tasks/vis/visBlink.js',

  // Output bundle
  output: {
    filename: 'visBlink_bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'visBlinkTask',   // exposes functions globally (optional but good)
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
