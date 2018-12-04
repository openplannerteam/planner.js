module.exports = {
  out: 'docs/code',
  includes: 'src/',
  exclude: [
    '**/*+(config|test).ts',
  ],
  mode: 'file',
  excludePrivate: true,
  excludeNotExported: true,
  excludeExternals: true,
  theme: 'minimal',
};
