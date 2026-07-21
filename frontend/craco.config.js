const CompressionWebpackPlugin = require('compression-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Only apply heavy optimizations in production
      if (process.env.NODE_ENV === 'production') {
        // Optimize chunk splitting
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                reuseExistingChunk: true,
              },
              recharts: {
                test: /[\\/]node_modules[\\/]recharts[\\/]/,
                name: 'recharts',
                priority: 30,
                reuseExistingChunk: true,
              },
              countryStateCity: {
                test: /[\\/]node_modules[\\/]country-state-city[\\/]/,
                name: 'location-data',
                priority: 30,
                reuseExistingChunk: true,
              },
              reactQuill: {
                test: /[\\/]node_modules[\\/]react-quill[\\/]/,
                name: 'editor',
                priority: 30,
                reuseExistingChunk: true,
              },
              radixUI: {
                test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                name: 'radix-ui',
                priority: 25,
                reuseExistingChunk: true,
              },
              socketIO: {
                test: /[\\/]node_modules[\\/]socket.io-client[\\/]/,
                name: 'socket',
                priority: 25,
                reuseExistingChunk: true,
              },
              common: {
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true,
                name: 'common',
              },
            },
            maxInitialRequests: 25,
            maxAsyncRequests: 25,
            minSize: 20000,
          },
          runtimeChunk: {
            name: 'runtime',
          },
        };

        webpackConfig.optimization.minimize = true;

        // Remove console.logs in production
        if (webpackConfig.optimization.minimizer) {
          const TerserPlugin = webpackConfig.optimization.minimizer.find(
            plugin => plugin.constructor.name === 'TerserPlugin'
          );
          if (TerserPlugin && TerserPlugin.options) {
            if (!TerserPlugin.options.terserOptions) {
              TerserPlugin.options.terserOptions = {};
            }
            if (!TerserPlugin.options.terserOptions.compress) {
              TerserPlugin.options.terserOptions.compress = {};
            }
            TerserPlugin.options.terserOptions.compress.drop_console = true;
            TerserPlugin.options.terserOptions.compress.drop_debugger = true;
          }
        }

        // Add Gzip compression
        webpackConfig.plugins.push(
          new CompressionWebpackPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8,
          })
        );
      }

      return webpackConfig;
    },
  },
};
