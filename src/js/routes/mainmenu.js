import { h, render } from 'preact';

export default (MainmenuPage) => {

  // export controller
  return function () {

    // clear previous component
    render('', this.$app, this.root);

    // render index page (should be cheap)
    this.root = render(<MainmenuPage />, this.$app);
  };
};
