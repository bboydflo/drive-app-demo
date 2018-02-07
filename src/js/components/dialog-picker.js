import { h, Component } from 'preact';
import InlinePicker from './inline-picker';
import Dialog from './modal/';

export default class DialogPicker extends Component {
  constructor (props) {
    super(props);

    // set internal state (not reactive)
    // this.date = '';
    this.date = props.value;
  }

  onDateChanged = (value) => {

    // update internal date variable (not reactive)
    this.date = value;
  }

  onConfirm = () => {

    // call the callback passed as prop
    this.props.onConfirm(this.date);
  }

  render (props) {

    // get props
    let {
      show,
      icon,
      title,
      value,
      xModal,
      modalId,
      onDismiss
    } = props;

    // create footer component
    let footerComponent = (
      <button type='button' class='btn btn-primary btn-block' onClick={this.onConfirm}>Ok</button>
    );

    return <Dialog
      icon={icon}
      size='modal-sm'
      show={show}
      title={title}
      xModal={xModal}
      modalId={modalId}
      keyboard={false}
      onDismiss={onDismiss}
      showFooter={true}
      bodyComponent={<InlinePicker value={value} onDateChanged={this.onDateChanged} />}
      footerComponent={footerComponent}
    />;
  }

  shouldComponentUpdate (nextProps) {

    /* // check current props and next props
    if (this.props.value === nextProps.value) return false;

    // resume
    return true; */

    // check current props and next props
    return (this.props.value !== nextProps.value);
  }
}
