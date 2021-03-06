import { h, render } from 'preact';
import Const from '../modules/constants';
import Language from '../modules/lang';

export default (SettingsPage, session) => {

  // export controller
  return function () {

    // clear previous component
    render('', this.$app, this.root);

    // render index page (should be cheap)
    this.root = render(
      <SettingsPage
        session={session}
        language={Language}
        constants={Const}
      />,
      this.$app
    );
  };
};
