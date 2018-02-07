import { h } from 'preact';

/*
 * val
 * cIdx
 * isEditable
 * isRemovable
 * layout
 * maxColIdx
 * onClickCell
 */
export default (props) => {

  let {
    val,
    cIdx,
    rIdx,
    layout,
    isTrash,
    maxColIdx,
    isEditable,
    onClickCell
  } = props;

  if (isTrash) {
    return (
      <td class='e-cell center toggleDelete clickable'>
        <a class='btn btn-xs btn-danger' data-toggle='true'>
          <span class='glyphicon glyphicon-trash' />
        </a>
      </td>
    );
  }

  // log
  // console.log(props);

  // log
  // console.log(props.editable);

  // id or dirty
  if (cIdx >= maxColIdx) return null;

  // edit mode
  let editMode = false;

  // get last header
  let lHeader = layout.thead[layout.thead.length - 1].th[cIdx];

  // get iClick
  let iClick = lHeader.iClick || 99;

  // read only
  let bReadOnly = lHeader.bReadOnly;

  // define cell
  let cell = null;

  let sDropDown = lHeader.sDropDown || '';
  let dropDownOptions = null;

  // define cell value
  let cellVal = val;

  let cellClass = lHeader.sClass;

  // is editable cell
  if (!isEditable || cellVal === '\u200B' || bReadOnly) {

    // update cell class
    cellClass += ' zws';
  } else {

    // check editable
    if (props.editable.length && rIdx === props.editable[0] && cIdx === props.editable[1]) {

      // should edit
      editMode = true;
    }
  }

  // let skip = false;

  switch (iClick) {
    case -1:
      // case  4:
      cell = <td class={'e-cell checkmark ' + cellClass} data-rIdx={rIdx} data-cIdx={cIdx} onClick={onClickCell}>
        <i class={'fa ' + (val ? 'fa-check-square-o' : 'fa-square-o')} aria-hidden='true' />
      </td>;
      break;
    case 4:
      cell = <td class={'e-cell checkmark ' + cellClass} data-rIdx={rIdx} data-cIdx={cIdx} onClick={onClickCell}>
        <i class={'fa ' + (val ? 'fa-check-square-o' : 'fa-square-o')} aria-hidden='true' />
      </td>;
      break;
    case 3:
      if (editMode) {
        // <Datetime ref={(input) => { $datePicker = input; }} onClick={onClickCell($datePicker)} />;
        cell = <td ref={props.cellRef} class={'e-cell datepicker ' + cellClass} data-rIdx={rIdx} data-cIdx={cIdx} onClick={onClickCell} />;
      } else {
        cell = <td class={'e-cell datepicker ' + cellClass} data-rIdx={rIdx} data-cIdx={cIdx} onClick={onClickCell}>{val}</td>;
      }
      break;
    case 1:
    case 7:
    case 11:
      if (editMode) {

        // update cell value
        cell = <td class={'e-cell' + (cellClass ? ' ' + cellClass : '')}>
          <input class={'e-cell-input ' + cellClass} type='number' value={val} />
        </td>;
      } else {

        // TODO: check if cell is in edit mode
        cell = <td class={'e-cell ' + (cellClass ? ' ' + cellClass : '')} data-rIdx={rIdx} data-cIdx={cIdx} onClick={onClickCell}>
          <span class='e-cell-value text-right'>{val}</span>
        </td>;
      }
      break;
    case 2:
    case 6:
    case 10:
    case 15:
      if (editMode) {

        // update cell value
        cell = <td class={'e-cell ' + (cellClass ? ' ' + cellClass : '')}>
          <input class={'e-cell-input ' + cellClass} type='text' value={val} />
        </td>;
      } else {

        // TODO: check if cell is in edit mode
        cell = <td class={'e-cell ' + (cellClass ? ' ' + cellClass : '')} data-rIdx={rIdx} data-cIdx={cIdx} onClick={onClickCell}>
          <span class='e-cell-value'>{val}</span>
        </td>;
      }
      break;
    case 5:

      // has dropdown options
      if (sDropDown) {
        try {
          dropDownOptions = JSON.parse(sDropDown.replace(/""/g, ''));
        } catch (e) {

          // toast
          // $.publish( 'toast', [ 2, 'JSON parse error! @ Views->Table->render()' ] );
          console.error('JSON parse error @body-cell');

          // skip functionality
          dropDownOptions = {};
        }

        // check if valid number
        if (!isNaN(cellVal)) {

          // update cell value
          cellVal = dropDownOptions[cellVal];
        }
      }

      if (editMode) {
        let _opt = [];
        for (let _key in dropDownOptions) {
          _opt.push(<option value={_key}>{dropDownOptions[_key]}</option>);
        }
        /* {map(dropDownOptions, (value, key) => {

          // let sel
          let sel = cellVal == parseInt(key, 10) ? 'selected' : null;

          // update value
          return <option value={key} selected={sel}>{val}</option>;
        })} */
        cell = <td class={'e-cell ' + (cellClass ? ' ' + cellClass : '')}>
          <select class='form-control'>{_opt}</select>
        </td>;
      } else {
        cell = <td class={'e-cell ' + cellClass} data-rIdx={rIdx} data-cIdx={cIdx} onClick={onClickCell}>
          <span class='e-cell-value'>{cellVal}</span>
        </td>;
      }

      break;
    default:
      if (editMode) {

        // update cell value
        cell = <td class={'e-cell ' + (cellClass ? ' ' + cellClass : '')}>
          <input class={'e-cell-input ' + cellClass} type='number' value={val} />
        </td>;
        cell = <input class={'e-cell-input ' + cellClass} type='text' value={val} />;
      } else {
        cell = (
          <td class={'e-cell ' + cellClass} data-rIdx={rIdx} data-cIdx={cIdx} onClick={onClickCell}>
            <span class='e-cell-value'>{cellVal}</span>
          </td>
        );
      }
  }
  return cell;
};
