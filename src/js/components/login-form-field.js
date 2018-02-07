import { h } from 'preact';

export default (props) => {
  let { icon } = props;
  return (
    <div class='form-group'>
      <div class='input-group'>
        <span class='input-group-addon'>
          {icon}
        </span>
        <input
          class='form-control'
          autocomplete='off'
          {...props}
        />
      </div>
    </div>
  );
};
