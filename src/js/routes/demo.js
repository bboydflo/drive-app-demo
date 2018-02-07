import { h, render } from 'preact';
import Const from '../modules/constants';
import Language from '../modules/lang';

export default (DemoView, session) => {

  // export controller
  return function () {

    // render index page (should be cheap)
    this.root = render(
      <DemoView
        session={session}
        language={Language}
        constants={Const}
      />,
      this.$app,
      this.root
    );
  };
};
