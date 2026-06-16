const path = require('path');

module.exports = {
  mode: 'production',  

  // Entry file for this task
  entry: './projs/skeleton/tasks/skeleton.js',

  // Output bundle
  output: {
    filename: 'skeleton_bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
        name: 'skel',
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