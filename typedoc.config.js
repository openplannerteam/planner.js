module.exports = {
  out: 'docs/code',
  includes: 'src/',
  exclude: [
    '**/*+(test).ts',
    '**/src/demo.*',
    '**/src/inversify.config.ts',
    '**/src/test/*',
    '**/fetcher/connections/tests/**/*',
  ],
  mode: 'file',
  excludePrivate: true,
  excludeNotExported: false,
  excludeExternals: false,
  includeDeclarations: false,
  theme: 'minimal',
};
