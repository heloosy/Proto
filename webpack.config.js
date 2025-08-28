const path = require('path');

module.exports = {
  entry: './src/popup.js', // Your main popup logic (import firebase-init.js here)
  output: {
    filename: 'popup.bundle.js',
    path: path.resolve(__dirname, '.'),
  },
  mode: 'production',
};