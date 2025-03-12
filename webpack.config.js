const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.js', // Now the entry point is inside src
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2',
    },
    target: 'node',
    devtool: 'source-map',
    externals: {
      vscode: 'commonjs vscode',
    },
};