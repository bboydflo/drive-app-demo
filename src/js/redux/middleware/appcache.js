/**
 * update app cache middleware
 */
const updateCache = ({ getState }) => next => action => {
  if (action.type === 'UPDATE_APP_CACHE') {
    let cStoreState = getState();

    const lang = cStoreState.ui.lang;
    const storageKey = cStoreState.settings.storageKey;
    const credentials = Object.assign({}, cStoreState.credentials);

    // backup data
    localStorage.setItem(storageKey + '.backup', JSON.stringify({ lang, credentials }));

    // clear local storage
    localStorage.removeItem(storageKey + '.root');

    // swap cache and reload app
    window.applicationCache.swapCache();
    window.location.reload(true);
  } else {
    return next(action);
  }
};

export default updateCache;
