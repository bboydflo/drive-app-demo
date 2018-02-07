// import _ from 'underscore';

export default (_, Backbone) => class AppRouter extends Backbone.Router {
  constructor (classProps) {

    // check http://backbonejs.org/docs/backbone.html#section-187
    super({
      routes: {
        '*splat': 'splat'
      }
    }, classProps);
  }

  initialize (opt, classProps) {

    // enhance router instance
    _.assign(this, classProps, {_history: []});

    // restore initial url
    window.location.hash = this.initialUrl || 'index';

    // listen to route changes
    this.listenTo(this, 'route', this.onUrlChanged);
  }

  // https://stackoverflow.com/questions/7563949/backbone-js-get-current-route?rq=1
  current () {
    const fragment = Backbone.history.fragment;
    const routes = _.pairs(this.routes);
    let route, name;

    let found = _.find(routes, namedRoute => {
      route = namedRoute[0];
      name = namedRoute[1];

      if (!_.isRegExp(route)) {
        route = this._routeToRegExp(route);
      }

      return route.test(fragment);
    });

    if (found) {
      return {
        name,
        params: this._extractParameters(route, fragment),
        fragment
      };
    }
  }

  /* // router gateway
  execute (callback, args, name) {

    // console.log(args, name);
    // console.log(this.current());
    console.log(this._history);
    // console.log(store.getState());
    // console.log(Backbone.history.getFragment());

    // log
    // console.log(isDirty);

    // compute previous history item
    // let prevHistoryItem = this._history.length > 0 ? this._history[this._history.length - 1] : false;
    let prevHistoryItem = this.getPreviousUrlPath();

    // log
    // console.log(prevHistoryItem);

    if (isDirty && prevHistoryItem) {

      // TODO: dispatch redux action
      // this.navigate(prevHistoryItem.fragment, {trigger: true});
      this.navigate(prevHistoryItem.fragment);

      // resume route transition
      return false;
    }

    // continue to specific route
    callback.apply(this, args);
  } */

  // returns a copy of the local _history object
  getFullHistory = () => {
    return this._history.concat();
  }

  getPreviousUrlPath = () => {
    return this._history.length > 0 ? this._history[this._history.length - 1] : false;
  }

  start = () => {
    Backbone.history.start();
  }

  // https://stackoverflow.com/questions/18735111/get-previous-router-url-in-backbone-application#18736567
  onUrlChanged (name, args) {
    /* let hItemObj = {
      name,
      args,
      fragment: Backbone.history.fragment
    };
    console.log(hItemObj); */

    // get fragment
    // let toFragment = Backbone.history.fragment;
    let toFragment = Backbone.history.getFragment();

    // get previous path
    let fromFragment = this.getPreviousUrlPath();

    // update local history
    this._history.push(toFragment);

    // udpate history in the top
    this.updateHistory(fromFragment, toFragment, this._history.concat());
  }

  syncUrl (url) {
    // url = typeof url === 'undefined' ? this.initialUrl : url;
    // this.navigate(url);
    this.navigate(typeof url === 'undefined' ? this.initialUrl : url);
  }
};
