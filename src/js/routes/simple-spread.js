import { h, render } from 'preact';

export default (SimpleSpreadPage, utils, session) => {

  // export controller
  return function (reqKey) {
    let layouts = session.get('layouts');
    let connection = session.get('app', 'connection');

    // get layout by request key
    let l = utils.getLayoutBy('requestKey', reqKey, layouts);

    // clear previous component
    render('', this.$app, this.root);

    // render index page (should be cheap)
    this.root = render(
      <SimpleSpreadPage
        layout={l}
        connection={connection}
      />,
      this.$app
    );
  };
};
