export default (store) => {
  function onUpdateReady () {
    store.dispatch({ type: 'UPDATE_APP_CACHE' });
  }
  window.applicationCache.addEventListener('updateready', onUpdateReady);
  if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
    onUpdateReady();
  }
};
