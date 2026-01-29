const path = require('path');

module.exports = {
  mode: 'production',   // use 'development' while debugging if you want

  // Entry file for this task
  entry: './projs/blink/tasks/shape/shapeBlink.js',

  // Output bundle
  output: {
    filename: 'shapeBlink_bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
        name: 'sblink',
        type: 'window',
    },
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
