const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const JsDocPlugin = require('jsdoc-webpack4-plugin');

var config = {
	context: path.resolve(__dirname, 'src'),
	entry: {
		index: './index',
		learndhondt: './learndhondt',
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle-[name]-[chunkhash].js',
		chunkFilename: 'chunk-[name]-[chunkhash].js',
	},
	devServer: {
		contentBase: path.resolve(__dirname, 'dist'),
	},
	plugins:[
		new CleanWebpackPlugin('dist/*'),
		// Rewrites html to insert generated css and js
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './mithriltemplate.html',
			chunks: ['common','index'],
			}),
		new HtmlWebpackPlugin({
			filename: 'learndhondt.html',
			template: './mithriltemplate.html',
			chunks: ['common','learndhondt'],
			}),
		// Split css included as js into a separate file again
		new MiniCssExtractPlugin({
			filename: "bundle-[name]-[contenthash].css",
			chunkFilename: "chunk-[name]-[contenthash].css",
			}),
        new JsDocPlugin({
            conf: './.jsdoc.json'
			}),
		new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
		// Analyzes generated sizes
//		new BundleAnalyzerPlugin({ analyzerMode: 'static' }),
	],
	module: {
		rules: [
			{ test: /\.yaml$/,   use: ["json-loader", "yaml-loader" ]},
			{ test: /\.css$/,    use: [ MiniCssExtractPlugin.loader, "css-loader"]},
			{ test: /\.scss$/,   use: [ MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]},
			{ test: /\.less$/,   use: [ MiniCssExtractPlugin.loader, "css-loader", "less-loader"]},
			{ test: /\.styl$/,   use: [ MiniCssExtractPlugin.loader, "css-loader", "stylus-loader"]},
			{ test: /\.jade$/,   loader: "jade-loader?self" },
			{ test: /\.png$/,    loader: "url-loader?prefix=img/&limit=5000" },
			{ test: /\.jpg$/,    loader: "url-loader?prefix=img/&limit=5000" },
			{ test: /\.gif$/,    loader: "url-loader?prefix=img/&limit=5000" },
			{ test: /\.woff(2)?$/,   loader: "file-loader?prefix=font/&limit=5000" },
			{ test: /\.eot$/,    loader: "file-loader?prefix=font/" },
			{ test: /\.ttf$/,    loader: "file-loader?prefix=font/" },
			{ test: /\.svg$/,    loader: "file-loader?prefix=font/" },
		]
	},
	optimization: {
		splitChunks: {
			//chunks: 'all',
		}
	},
	externals: [
		'child_process',
	],
};

module.exports = (env, argv) => {

  if (argv.mode === 'development') {
    config.devtool = 'source-map';
  }

  if (argv.mode === 'production') {
  }

  return config;
};


// vim: noet ts=4 sw=4
