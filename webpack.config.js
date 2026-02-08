const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

const config = {
  devtool: 'source-map',

  entry: './client/js/app.js',

  resolve: {
    extensions: ['.js'],
  },

  output: {
    path: path.join(__dirname, 'client'),
    // Use contenthash for long-term caching in prod. Keep stable name in dev.
    filename: isProd ? 'bundle.[contenthash].js' : 'bundle.js',
    clean: false,
  },

  module: {
    rules: [
      {
        test: /.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [
    // Generate client/index.html with the correct hashed bundle filename injected.
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'client', 'index.template.html'),
      filename: 'index.html',
      inject: 'head',
      scriptLoading: 'blocking',
    }),
  ],
};

module.exports = config;

