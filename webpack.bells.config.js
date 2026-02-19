const path = require('path');

module.exports = {
  mode: 'production',  

  // Entry file for this task
  entry: './projs/bells/tasks/bells.js',

  // Output bundle
  output: {
    filename: 'bells_bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
        name: 'bells',
        type: 'window',
        export: 'default',
    },
  },

  // Import HTML & CSS 
    module: {
    rules: [
      {
        test: /\.html$/i,
        use: "html-loader",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      }
    ]
  }
};