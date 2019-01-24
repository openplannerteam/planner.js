// Mocks the (only) user of the q promise library by ldfetch

module.exports = {
  defer: () => {
    const deferred = {};

    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    return deferred;
  }
};
