export default (namespace) => {

  // check for namespace
  if (!global.hasOwnProperty(namespace)) {

    // create namespace
    global[namespace] = {};
  }

  // return namespace
  return global[namespace];
};
