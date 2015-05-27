all: \
	node_modules/.install \
	index.js \
	dist/d3_xhr.js \
	dist/d3_xhr.min.js

node_modules/.install: package.json
	npm install && touch node_modules/.install

dist/d3_xhr.js: index.js node_modules/.install
	mkdir -p $(dir $@)
	node_modules/.bin/browserify $< --standalone xhr -o $@

dist/d3_xhr.min.js: dist/d3_xhr.js node_modules/.install
	node_modules/.bin/uglifyjs $< -c -m -o $@

D3_FILES = \
	start.js \
	node_modules/d3/src/xhr/xhr.js \
	end.js

index.js: $(D3_FILES) node_modules/.install start.js
	node_modules/.bin/smash $(D3_FILES) > $@
	./patch index.js

start.js: node_modules/.install
	grep -v "!function()" node_modules/d3/src/start.js > $@
