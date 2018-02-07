'use strict';

// libs
import m from 'mithril';

let count = 0;

export default {
  view() {
    return (
      <div>
        <h1>Hello world! { count }</h1>
        <button onclick={this.updateCounter.bind(this)}> click </button>
      </div>
    );
  },
  updateCounter(e) {

    // log
    console.log(e);

    // update counter
    count += 1;
  }
};
