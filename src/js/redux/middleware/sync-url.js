/**
 * sync url bar with store url
 * TODO: prevent navigation if current page is dirty
 * TODO: prevent navigation to index and settings if loggedIn = true
 * TODO: prevent navigation to other pages than index and settings if loggedIn = false
 */
const syncUrlBar = store => next => action => {
  if (action.type === 'NAVIGATE_TO') {
    let { page, Backbone } = action.payload;
    if (Backbone && page) {
      // Backbone.history.navigate(page);
      Backbone.history.navigate(page, {trigger: true});
    }
  }
  next(action);
};

export default syncUrlBar;
