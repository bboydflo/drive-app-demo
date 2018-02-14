### Things to keep in mind

`/* eslint-disable */` will disable eslint on the next line. if put on the top of the file will disable linting for the entire file. read more at [this link](https://eslint.org/docs/user-guide/configuring#disabling-rules-with-inline-comments)

use `// eslint-disable-next-line` to disable `eslint` for the next line

### To build the project

```sh
$ npm install
$ npm run build
```

### To open a local server

```sh
$ npm run serve
```

> This demo needs to run inside github pages because it's using google api which cannot be used from `localhost`

### TODO's

- [x] add pdf.js
- [x] add integration with google drive api
- [x] implement new route to be able to open files from google drive
- [ ] add custom widget to see folders and files from google drive
