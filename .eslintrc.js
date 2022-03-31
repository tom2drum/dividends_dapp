module.exports = {
    env: {
        browser: true,
        es2021: true,
        mocha: true,
        node: true,
    },
    // plugins: [ '@typescript-eslint' ],
    extends: [
        'react-app', 
        'react-app/jest',
        'eslint:recommended',
        'plugin:node/recommended'
    ],
    settings: {
        node: {
            tryExtensions: [ '.js', '.json', '.node', '.ts', '.tsx', '.d.ts' ]
        },
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        'node/no-unsupported-features/es-syntax': [ 'error', { ignores: [ 'modules' ] } ],
        'indent': [ 'error', 4 ],
        quotes: [ 'error', 'single' ],
        'object-curly-spacing': [ 'error', 'always' ],
        'array-bracket-spacing': [ 'error', 'always' ],
        'jsx-quotes': [ 'error', 'prefer-double' ],
        'react/jsx-key': 'error',
        'react/jsx-curly-brace-presence': [ 'error', {
            props: 'never',
            children: 'never',
        } ],
        'react/jsx-curly-spacing': [ 'error', {
            when: 'always',
            children: true,
            spacing: {
                objectLiterals: 'never',
            },
        } ],
        'react/jsx-equals-spacing': [ 'error', 'never' ],
        'react/jsx-fragments': [ 'error', 'syntax' ],
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-target-blank': 'off',
        'react/jsx-no-useless-fragment': 'error',
        'react/jsx-tag-spacing': [ 'error', {
            afterOpening: 'never',
            beforeSelfClosing: 'never',
            closingSlash: 'never',
        } ],
        'react/jsx-wrap-multilines': [ 'error', {
            declaration: 'parens-new-line',
            assignment: 'parens-new-line',
            'return': 'parens-new-line',
            arrow: 'parens-new-line',
            condition: 'parens-new-line',
            logical: 'parens-new-line',
            prop: 'parens-new-line',
        } ],
    },
};
