import { h } from 'preact';
import renderHeaderRow from './header-row';

export default props => {

  return <thead>{
    props.layout.thead.map((th, idx) => {
      return renderHeaderRow(th.th, idx === props.layout.thead.length - 1, props.hasRemovableRows);
    })
  }</thead>;
};
