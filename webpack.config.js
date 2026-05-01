const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ThemeWatcher = require('@salla.sa/twilight/watcher.js');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const asset = (file) => path.resolve('src/assets', file || '');
const publicDir = (file) => path.resolve('public', file || '');

module.exports = {
  entry: {
    app: [asset('styles/app.css'), asset('js/app.js')],
    home: asset('js/home.js'),
    'product-card': asset('js/partials/product-card.js'),
    'main-menu': asset('js/partials/main-menu.js'),
    checkout: [asset('js/cart.js'), asset('js/thankyou.js')],
    pages: asset('js/pages.js'),
    product: [asset('js/product.js'), asset('js/products.js')],
    order: asset('js/order.js'),
  },
  output: {
    path: publicDir(),
    clean: true,
    chunkFilename: '[name].[contenthash].js',
  },
  stats: { modules: false, assetsSort: 'size', assetsSpace: 50 },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          /node_modules/,
          asset('js/twilight.js'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [['@babel/plugin-transform-runtime', { regenerator: true }]],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false } },
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    new ThemeWatcher(),
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [{ from: asset('images'), to: publicDir('images'), noErrorOnMissing: true }],
    }),
  ],
  optimization: {
    minimizer: [`...`, new CssMinimizerPlugin()],
  },
};
