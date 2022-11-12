module.exports = {
  '*': () => [`prettier --write 'src/**'`, `eslint 'src/**'`],
};
