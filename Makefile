all: node_modules/.install index.js

node_modules/.install: package.json
	npm install && touch node_modules/.install

D3_FILES = \
	start.js \
	node_modules/d3/src/xhr/xhr.js \
	end.js

index.js: $(D3_FILES)
	node_modules/.bin/smash $(D3_FILES) > $@
