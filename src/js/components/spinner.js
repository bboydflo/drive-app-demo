import { h, Component } from 'preact';

export default class Spinner extends Component {

  render () {
    return <div class='spinner-component' />;
  }

  componentDidMount () {
    if (this.props.show) {
      window._SmartPigs.spinner.show();
    } else {
      window._SmartPigs.spinner.hide();
    }
  }

  componentWillUnmount () {
    window._SmartPigs.spinner.hide();
  }
};
