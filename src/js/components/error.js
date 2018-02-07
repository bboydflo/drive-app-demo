import { h } from 'preact';

export default (props) => {
  return (
    <div class='error-component'>
      <div class='alert alert-danger alert-dismissible' role='alert'>
        <button type='button' class='close' aria-label='Close' onClick={props.onClose}>
          <span aria-hidden='true'>&times;</span>
        </button>
        <strong>{props.title}</strong> {props.message}
      </div>
    </div>
  );
};
