const path = require('path')
/** @type {import('next').NextConfig} */
const { withTamagui } = require('@tamagui/next-plugin')

const projectRoot = path.resolve(__dirname, '../..')

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // KHÔNG dùng webpack alias và externals cho Server ở đây nữa
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
      'react-native-svg': '@tamagui/react-native-svg',
    }


    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]'
      }
    })

    return config
  },

  transpilePackages: [
    'solito',
    'react-native-web',
    '@tamagui/react-native-svg',
    '@tamagui/next-theme',
    '@tamagui/lucide-icons',
    'app',
    'expo-modules-core',
    'expo-constants',
    'expo-linking'
  ],

  experimental: {
    scrollRestoration: true,
  },
}

module.exports = withTamagui({
  config: path.join(projectRoot, 'packages/config/src/index.ts'),
  components: ['tamagui', 'app'],
  disableExtraction: process.env.NODE_ENV === 'development',
})(nextConfig)