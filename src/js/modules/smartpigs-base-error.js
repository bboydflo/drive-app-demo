// constructor
// original code from here: http://jsbin.com/rolojuhuya/1/edit?js,console
// and here: http://stackoverflow.com/questions/783818/how-do-i-create-a-custom-error-in-javascript#871646
export default class SmartPigsError {
  constructor (message, errorType, errorPayload) {
    let error = Error.call(this, message);
    this.name = 'SmartPigsError';
    this.message = error.message || message;
    this.stack = error.stack;
    this.type = typeof errorType === 'undefined' ? -1 : errorType;
    this.payload = errorPayload || {};
    this.source = this.payload.source || 'SmartPigs';

    // log
    // console.log(this.stack);
    console.log(this);
  }
}

/*
function SmartPigsError(message, errorType, errPayload) {
  var error = Error.call(this, message);
  this.name = 'SmartPigsError';
  this.message = error.message;
  this.stack = error.stack;
  this.errorType = typeof errorType == 'undefined' ? -1 : errorType;
  this.errPayload = errPayload || {};
}

SmartPigsError.prototype = Object.create(Error.prototype);
SmartPigsError.prototype.constructor = SmartPigsError;

var customError = new SmartPigsError('some error message', 42);

console.log(customError.name + ' => SmartPigsError');
console.log(customError.message + ' => some error message');
console.log(customError.customProperty + ' => 42');
console.log((customError instanceof Error) + ' => true');
console.log((customError instanceof SmartPigsError) + ' => true');

console.log('constructor: ' + customError.constructor);
console.log('toString: ' + customError.toString());
console.log('stack: ' + customError.stack);

try {
  // assume an exception occurs
} catch (exception) {
  if (exception instanceof TypeError) {
    // Handle TypeError exceptions
  } else if (exception instanceof ReferenceError) {
    // Handle ReferenceError exceptions
  } else {
    // Handle all other types of exceptions
  }
}
*/

// also error documentation
// https://www.sitepoint.com/exceptional-exception-handling-in-javascript/
// https://www.sitepoint.com/proper-error-handling-javascript/
