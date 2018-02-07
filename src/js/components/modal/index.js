import { h, Component } from 'preact';
import $ from 'jquery';

export default class Modal extends Component {

  render (props) {
    let dismissOnEsc = props.keyboard || 'false';

    // define footer style
    let showFooter = props.showFooter || false;

    // setup modal dialog size
    let dialogSize = 'modal-dialog' + (props.size ? ' ' + props.size : '');

    // check fade effect
    let fadeEffect = 'modal' + (props.fade ? ' ' + props.fade : '');

    return (
      <div ref={input => {
        this.$modal = input;
      }} id={props.modalId} class={fadeEffect} tabindex='-1' role='dialog' data-backdrop={props.backdrop || 'static'} data-keyboard={dismissOnEsc}>
        <div class={dialogSize}>
          <div class='modal-content'>
            <div class='modal-header'>
              {props.xModal &&
                <button type='button' class='close' aria-hidden='true' onClick={props.onDismiss}>×</button>
              }
              <h4 class='modal-title'>
                {props.icon && <span class={'glyphicon glyphicon-' + props.icon} />}
                <span class='title'> {props.title}</span>
              </h4>
            </div>
            <div class='modal-body blank-body'>
              <div class='error-component'>{props.errorComponent}</div>
              <div class='body-component'>{props.bodyComponent}</div>
            </div>
            {showFooter &&
              <div class='modal-footer'>{props.footerComponent}</div>
            }
          </div>
        </div>
      </div>
    );
  }

  componentDidMount () {

    // check props
    // console.log('should be shown: ', this.props.show);

    // get modal init action
    let modalAction = this.props.show ? 'show' : 'hide';

    // init modal with action
    $(this.$modal).modal(modalAction);
  }

  componentDidUpdate () {

    // init modal
    // $(this.$modal).modal();

    // check props
    if (this.props.show) {
      $(this.$modal).modal('show');
    } else {
      $(this.$modal).modal('hide');
    }
  }
}
