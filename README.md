[d3.xhr](https://github.com/mbostock/d3/wiki/Requests#xhr) packaged as an npm module for use with browserify.

### Usage

#### Browserify

```javascript
var xhr = require('d3-xhr');
xhr(url, mimeType, callback);
```

#### In the browser

```html
<script src="dist/d3_xhr.min.js"></script>

<script>
xhr(url, mimeType, callback);
</script>
```

### Build

To build an up to date version with the latest version of d3:

```sh
npm update
make
```

Note that things may not work as expected if things change in d3. You may need to make changes to `patch`. If you do update and check it works, please send a pull request and I'll update npm.

### Documentation

https://github.com/mbostock/d3/wiki/Requests#xhr
