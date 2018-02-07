export default (broker, StackTrace, StackTraceGPS) => {

  // callback error
  const globalErrorHandler = (message) => {

    // local lets
    let firstStack;

    // return handler
    return function report (stack) {

      // hide spinner and stop progress
      broker.emit('smartpigs', ['spinner', {state: false}]);
      broker.emit('smartpigs', ['progress', {state: false}]);

      try {
        let gps = new StackTraceGPS({});

        // check if first stack trace
        if (typeof firstStack === 'undefined') {

          // get first stack
          firstStack = stack[0];

          // append message
          firstStack.message = message;

          // Pinpoint actual function name and source-mapped location
          gps.pinpoint(firstStack).then(toastError.bind(firstStack), errback);
        }

        // var yourErrorCollectorUrl = 'https://yourdomain.com/ec';
        // stack.message = message;
        // HTTP POST with {message: String, stack: JSON}
        // StackTrace.report(stack, yourErrorCollectorUrl);

        // set namespace and log message
        console.warn('Error:', message + ', stack: ' + firstStack);
      } catch (e) {

        // log
        console.error('UNCAUGHT GLOBAL ERROR: %o', e);
      }
    };
  };

  // error handler
  // var errback = function myErrback(error) { console.log(StackTrace.fromError(error)); };
  const errback = (err) => { console.log(err); };

  // gps callback
  const toastError = (errorSource) => {

    // publish toast
    // errorSource.toString() + ' in ' +
    // errorSource.fileName + ':' +
    // errorSource.functionName + '('+
    // errorSource.lineNumber + ', ' +
    // errorSource.columnNumber + ')'] );
    broker.emit('smartpigs', ['toast', {
      type: 3,
      message: `Error: ${this.message} in ${errorSource.toString()}!`
    }]);
  };

  // global error handler
  return (msg, file, line, col, error) => {
    try {

      // get callback handler
      let callback = globalErrorHandler(msg);

      // parse error
      StackTrace.fromError(error, { offline: true }).then(callback).catch(errback);
    } catch (e) {

      // TODO: handle if something goes wrong in the error logger,
      // so that you don't get into an infinite loop, then sorry.
      console.log('GlobalError: ', e.message || e.toString());
    }
  };
};
