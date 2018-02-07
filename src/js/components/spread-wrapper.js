import { h } from 'preact';
import Cols from './cols';
import TableHead from './thead';
import TableBody from './spread-body';

export default (props) => {

  let { id = '', wrapperStyles, bodyStyles } = props;

  console.log(props);

  return (
    <div class='component-wrapper'>
      <div id={id} class='smartpigs-wrapper' style={wrapperStyles}>
        <table class='table table-bordered smartpigs-table sm-table-header'>
          <Cols {...props} />
          <TableHead {...props} />
        </table>
        <div class='sm-table-body' style={bodyStyles}>
          <TableBody {...props} >
            <Cols {...props} />
          </TableBody>
        </div>
      </div>
    </div>
  );
};
