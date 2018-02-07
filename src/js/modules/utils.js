export function removeByKey (myObj, deleteKey) {
  return Object.keys(myObj)
    .filter(key => key !== deleteKey)
    .reduce((result, current) => {
      result[current] = myObj[current];
      return result;
    }, {});
};

// export function setLayoutsIconName (l) {
export function setLayoutsIconName (layouts) {

  // define sides
  let sides = ['left', 'center', 'right'];

  // filter sides that have no items
  sides = sides.filter(sideName => layouts[sideName] && layouts[sideName].items && layouts[sideName].items.length);

  // validate sides. resume early
  if (!sides.length) return false;

  // map through remaining sides
  sides.map(sideName => {

    // filter wrong layouts
    layouts[sideName].items = layouts[sideName].items.filter(item => {

      // check each header
      for (var i = 0; i < item.thead.length; i++) {

        // filter wrong layouts
        if (!item.thead[i].th.length && item.requestKey.toLowerCase().indexOf('card') < 0) return false;
      }

      // resume
      return true;
    });

    // map through each item and add 'iconName' attribute
    layouts[sideName].items.map(item => {

      // add iconName attribute to each item
      // assume that imagePath attribute exists on each item
      item.iconName = item.imagePath.split('.')[0];

      // resume
      return item;
    });

    return layouts;
  });

  // add nested layouts
  layouts.nested = {
    items: []
  };

  return layouts;
};

export function getSpLang (response) {
  let spLang = {};
  let texts = response.texts || '';

  if (texts) {

    // parse reponse
    texts = texts.split('","');

    // check langs
    if (Array.isArray(texts) && texts.length) {

      // map through langs and create countries
      texts.map(val => {
        if (!val) return;

        // let wordDetails = val.split(':');
        let wordDetails = val.split('":"');

        if (!Array.isArray(wordDetails) || wordDetails.length < 2) return;

        // original values. remove commas
        let wordCode = wordDetails[0].replace(/"/g, '');
        let wordText = wordDetails[1].replace(/"/g, '');

        if (!wordCode || wordText === ' ') return;

        // update text object
        spLang[wordCode] = wordText;
      });
    }

    // delete texts from response
    delete response.texts;

    return spLang;
  }
};

export function fixDateFormat (response) {

  // update default date format in order to accomodate the new formatting library
  let dateFormat = response.dataFormat || 'dd-MM-yy';

  // strip out ['']
  return dateFormat.replace(/'/g, '');
};

export function transformLoginResponse (response) {

  // make a copy of the original layouts
  let layouts = Object.assign({}, response);

  layouts = setLayoutsIconName(layouts);

  layouts.text = getSpLang(layouts);
  layouts.dateFormat = fixDateFormat(layouts);

  return layouts;
};

// return first layout found by key and value
export function getLayoutBy (layouts, key1, val1) {
  let menuItems = [];

  for (let k in layouts) {
    if (k === 'left' || k === 'center' || k === 'right') {
      // eslint-disable-next-line
      menuItems = menuItems.concat(layouts[k].items.filter(item => item[key1] == val1));
    }
  }

  return menuItems.length ? menuItems[0] : false;
};
