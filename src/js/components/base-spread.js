import { h, Component } from 'preact';
import Error from './error';
import Counter from './counter';
import Connection from './connection';
import SpreadWrapper from './spread-wrapper/';

// define statefull component
export default () => class BaseSpread extends Component {

  // define some internal state
  state = {};

  render (props, state) {

    // log programatically
    if (process.env.NODE_ENV === 'development') {

      // log
      console.log(state);
    }

    if (props.isCardView) {
      return <div class='sowcard-component' />;
    }

    return (
      <div class='progeny-component'>
        <div class='panel panel-default layout'>
          <div class='panel-heading clearfix'>
            <h3 class='panel-title pull-left'>{props.layout.menuTitle}</h3>
          </div>
          <div class='panel-body'>
            {props.hasError && <Error />}
            {props.findAnimal &&
              <div class='find-animal-component'>
                <div class='input-group'>
                  <span class='input-group-btn'>
                    <button class='btn btn-default animal-serial' type='button' data-event='find-animal'>
                      <span class='glyphicon glyphicon-search' /> {props.placeholder}
                    </button>
                  </span>
                  <input type='text' class='form-control animal-serial' placeholder={props.placeholder} />
                </div>
              </div>
            }
            <SpreadWrapper {...props} />
          </div>
          <div class='panel-footer clearfix'>
            <span class='footer-left'>
              {/* <Counter title='Cntr' selected={0} visible={data.length} /> */}
              <Counter title='Cntr' selected={0} />
            </span>
            <span class='footer-right pull-right'>
              <Connection connection />
            </span>
          </div>
        </div>
      </div>
    );
  }
};
