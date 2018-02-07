'use strict';

// libs
import getProp from 'get-prop';

// lodash functions
import { map, filter, cloneDeep } from 'lodash';

// exports
export default ($, Layout, utils, template) => {

  // return table body view
  return class V extends Layout {

    constructor(options) {
      super (options);

      // define template
      this.template = template; // Templates.hbs['scrolling-body'],
    }

    // some inspiration - SlickGrid
    // http://jsfiddle.net/SDa2B/4/
    // full discussion here: https://github.com/mleibman/SlickGrid/issues/22
    serialize() {
      var i, tModel,
        tWidth = 0,
        hasRemovable = 0,
        removeRowHtml = '<a class="btn btn-xs btn-danger" data-toggle="true" ><span class="glyphicon glyphicon-trash"></span></a>';

      // get table model
      tModel = this.model.toJSON();

      // get table properties
      var props = tModel.properties;
      var tHead = cloneDeep( tModel.tHead );
      var tRows = cloneDeep( tModel.tRows );

      // get fake rows height
      var rowBeforeHeight = tModel.rowBeforeHeight;
      var rowAfterHeight  = tModel.rowAfterHeight;

      // get selected rows
      var selectedRows = filter(tRows, function(row){ return (1 - row.hidden) && row.selected; });

      // reset visible rows
      var vRows = [];

      // update visible rows
      for( i=tModel.tIndex; i<tModel.bIndex; i++ ) {
        if ( typeof selectedRows[i] !== 'undefined' ) {
          vRows.push( selectedRows[i] );
        }
      }

      // check if there are any rows
      if ( vRows.length ) {

        // modify data array
        vRows = map(vRows, function(tRow) {

          // check if it has extra columns (default option)
          if ( tModel.tExtra ) {

            // remove 'id' and 'dirty'
            tRow.data.splice( -2 );
          }

          // transform rows data coresponding to handlebars template
          tRow.data = map( tRow.data, function(dataVal, cIndex) {
            var dropDownOptions,
              cellValue     = dataVal,
              checkedHtml   = '<i class="fa fa-check-square-o" aria-hidden="true"></i>',
              uncheckedHtml = '<i class="fa fa-square-o" aria-hidden="true"></i>';

            // get column props
            var bReadOnly = getProp(tHead[props.lastHeaderIdx].th[cIndex], ['bReadOnly']);
            var iClick    = getProp(tHead[props.lastHeaderIdx].th[cIndex], ['iClick'], -1);
            var sClass    = getProp(tHead[props.lastHeaderIdx].th[cIndex], ['sClass'], '');
            var sDropDown = getProp(tHead[props.lastHeaderIdx].th[cIndex], ['sDropDown'], '');

            // update cell class
            var cellClass = sClass;

            // check data val
            if ( cellValue == '\u200B' || bReadOnly ) {

              // update cell class
              cellClass += ' zws ';
            }

            // define input attribute
            var iAttr = '';

            // check cell type
            switch ( iClick ) {
            case -1:

              // update cell value
              cellValue = dataVal ? checkedHtml : uncheckedHtml;

              // update cell class
              cellClass = 'checkmark';
              break;
            case 1:
            case 7:
            case 11:

              // remove decimals
              cellValue = utils.cutDecimals( dataVal, 2 );

              // editable
              if ( !/zws/i.test(cellClass) ) {

                // update cell value
                cellValue = '<input class="e-cell-input ' + cellClass + '" type="number" '+ iAttr +' value="' + cellValue + '" />';
              } else {

                // update cell value
                cellValue = '<span class="e-cell-value">' + cellValue + '</span>';
              }
              break;
            case 2:
            case 6:

              // editable
              if ( !/zws/i.test(cellClass) ) {

                // update cell value
                cellValue = '<input class="e-cell-input ' + cellClass + '" type="text" ' + iAttr + ' value="' + cellValue + '" />';
              } else {

                // update cell value
                cellValue = '<span class="e-cell-value">' + cellValue + '</span>';
              }
              break;
            case 3:

              // update datepicker cells class
              cellClass += 'datepicker';
              break;
            case 4:

              // update value
              cellValue = dataVal ? checkedHtml : uncheckedHtml;
              break;
            case 5:

              // has dropdown options
              if ( sDropDown ) {
                try {
                  dropDownOptions = JSON.parse( sDropDown.replace(/""/g, '') );
                } catch ( e ) {

                  // toast
                  $.publish( 'toast', [ 2, 'JSON parse error! @ Views->Table->render()' ] );

                  // skip functionality
                  dropDownOptions = {};
                }

                // check class name
                if ( !/zws/i.test(cellClass) ) {

                  // field value
                  var fieldValue = '<select class="form-control" ' + iAttr + '>' ;

                  // map through dropDownOptions
                  map(dropDownOptions, function(value, key) {

                    // check current value
                    if ( cellValue == parseInt(key, 10) ) {

                      // update value
                      fieldValue += '<option value="' + key + '" selected>' + value + '</option>';
                    } else {

                      // update value
                      fieldValue += '<option value="' + key + '">' + key + ', ' + value + '</option>';
                    }
                  });

                  // update cell value
                  fieldValue += '</select>';

                  // update cell value with field value
                  cellValue = fieldValue;
                } else {

                  // check if valid number
                  if ( !isNaN( dataVal ) ) {
                    cellValue = '<span class="e-cell-value">' + dropDownOptions[dataVal] + '</span>';
                  }
                }
              }
              break;
            default:
              cellClass += ' simple-value';
              break;
            }

            // create new data object
            return {
              value: cellValue,
              class: cellClass
            };
          });

          // check for removable
          if ( tRow.removable ) {

            // update has removable
            hasRemovable = 1;

            // add extra object in the data array
            tRow.data.push({
              value: removeRowHtml,
              class: 'center toggleDelete clickable'
            });
          }

          // resume
          return tRow;
        });

        // has removable rows
        if ( hasRemovable ) {

          // update header
          tHead[tHead.length-1].th.push({
            iSpan: 1,
            iWidth: 40,
            sClass: '',
            sTitle: ''
          });
        }
      } else {

        // update vRows
        vRows = selectedRows;
      }

      return {
        tHead: tHead,
        tRows: vRows,
        tWidth: tWidth,
        rowBeforeHeight: rowBeforeHeight,
        rowAfterHeight: rowAfterHeight
      };
    }
  };
};
