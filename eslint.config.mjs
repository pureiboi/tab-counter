import configStandard from 'eslint-config-standard'
import { FlatCompat } from '@eslint/eslintrc'

import { defineConfig } from 'eslint/config'

export default defineConfig([
  // {
  //   extends: [configStandard],
  // },
  ...new FlatCompat().extends('eslint-config-standard'),
  {
    languageOptions: {
      globals: {
        browser: true,
        chrome: "readonly",
        globalThis: "readonly"
      }
    }
  }
])
