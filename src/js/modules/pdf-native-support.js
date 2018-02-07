const getBrowserName = () => {
  var userAgent = global.navigator ? global.navigator.userAgent.toLowerCase() : 'other';
  if (userAgent.indexOf('chrome') > -1) {
    return 'chrome';
  } else if (userAgent.indexOf('safari') > -1) {
    return 'safari';
  } else if (userAgent.indexOf('msie') > -1 ||
    navigator.appVersion.indexOf('Trident/') > 0) {
    return 'ie';
  } else if (userAgent.indexOf('firefox') > -1) {
    return 'firefox';
  } else {

    // return "ie";
    return userAgent;
  }
};

const getActiveXObject = (name) => {
  try { return new ActiveXObject(name); } catch (e) {

    // log
    console.error(e.message || e.toString());
  }
};

const getNavigatorPlugin = (name) => {
  var key, plugin;
  for (key in navigator.plugins) {
    plugin = navigator.plugins[key];
    if (plugin.name === name) {
      return plugin;
    }
  }
};

const getPDFPlugin = () => {
  if (getBrowserName() === 'ie') {

    // load the activeX control
    // AcroPDF.PDF is used by version 7 and later
    // PDF.PdfCtrl is used by version 6 and earlier
    return getActiveXObject('AcroPDF.PDF') ||
    getActiveXObject('PDF.PdfCtrl');
  } else {
    return getNavigatorPlugin('Adobe Acrobat') ||
    getNavigatorPlugin('Chrome PDF Viewer') ||
    getNavigatorPlugin('WebKit built-in PDF');
  }
};

const isAcrobatInstalled = () => !!getPDFPlugin();

const getAcrobatVersion = () => {
  try {
    var plugin = getPDFPlugin();

    if (getBrowserName() === 'ie') {
      var versions = plugin.GetVersions().split(',');
      var latest = versions[0].split('=');
      return parseFloat(latest[1]);
    }

    if (plugin.version) {
      return parseInt(plugin.version);
    }
    return plugin.name;
  } catch (e) {
    return null;
  }
};

// acrobat reader plugin detection - not IE compatible. check url
// https://gist.github.com/benkitzelman/6d4ead05b3d4b80518f3#file-gistfile1-js
// check js/modules/detect-pdfReader.js
export default () => {

  // update store with acrobatInfo object
  return {
    browser: getBrowserName(),
    installed: isAcrobatInstalled(),

    // acrobat: isAcrobatInstalled() ? 'installed' : false,
    version: getAcrobatVersion()
  };
};
