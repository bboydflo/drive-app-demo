import {h} from 'preact';
import LoginFormField from './login-form-field';

export default (props) => {
  let { children, fields } = props;
  let someRandomValue = +Date.now();

  return (
    <form class='form-horizontal' autocomplete='off'>

      <div class='hidden'>
        <input type='text' id='PreventChromeAutocomplete' name='PreventChromeAutocomplete' autocomplete={`some-random-string-${someRandomValue}`} />
      </div>

      {children}

      {fields.map((f, idx) => (
        <LoginFormField
          {...f}
          data-findex={idx}
          onChange={props.onFieldChanged}
        />
      ))}

    </form>
  );
};
