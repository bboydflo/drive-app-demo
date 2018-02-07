import { h } from 'preact';
import _ from 'underscore';
import BodyCell from './body-cell';

// render row utility
let renderRow = (row, rowIdx, maxColIdx, props) => {

  let isRemovable = row.removable;
  let isEditable = row.editable;
  let rowId = row.data[row.data.length - 2];
  let isMarked = false;

  return (
    <tr key={rowId} data-hidden='false' data-editable={isEditable} data-rowid={rowId} data-marked={isMarked}>
      {row.data.map((val, cIdx) => {
        return <BodyCell
          val={val}
          cIdx={cIdx}
          rIdx={rowIdx}
          layout={props.layout}
          cellRef={props.cellRef}
          maxColIdx={maxColIdx}
          isEditable={isEditable}
          editable={props.editable}
          onClickCell={props.onClickCell}
        />;
      })}
      {isRemovable && <BodyCell isTrash />}
    </tr>
  );
};

export default (props) => {

  // get tWidth
  let { tWidth } = props;

  // get last header
  let lastHeader = props.layout.thead;

  // get last header index (how many columns are on the last header?)
  let lastHeaderIdx = lastHeader[props.layout.thead.length - 1].th.length - 2;

  // define table styles
  let tStyle = 'width: ' + tWidth + 'px';

  // define table rows
  let tRows = _.map(props.data, (row, rowIdx) => renderRow(row, rowIdx, lastHeaderIdx, props));

  return (
    <table class='table table-bordered smartpigs-table' style={tStyle}>
      {props.children}
      <tbody class='body-scroll'>
        {tRows}
      </tbody>
    </table>
  );
};
