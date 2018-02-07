import { h, Component } from 'preact';
import $ from 'jquery';

export default class InlinePicker extends Component {

  render (props) {

    // get value
    let val = props.value; // || '12/03/2012';

    // setup the inline datepicker with the initial date
    return <div ref={el => { this.$el = el; }} data-date={val} data-date-format='dd/mm/yyyy' style='text-align: center;' />;
  }

  componentDidMount () {

    // apply date picker plugin to created ref this.$el with custom options
    $(this.$el).datepicker({
      maxViewMode: 2,
      todayBtn: true
    }).on('changeDate', (e) => {

      // inspect event
      // console.log(e);

      // TODO: format the new date accordingly (what if there is no default format)
      // better idea, make the datepicker work with the same format, and only~ convert
      // to and from other formats. maybe accept this format as a prop. the work should
      // be done on the parent component
      let newDate = e.format(this.props.format);

      // call onChanged
      this.props.onDateChanged(newDate);
    });
  }

  componentDidUpdate () {

    // reapply date picker plugin with the new value
    $(this.$el).datepicker('update', this.props.value);

    // check some props
    $(this.$el).datepicker('show');
  }

  componentWillUnmount () {
    $(this.$el).remove();
  }
}
