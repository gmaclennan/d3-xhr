all: index.js

D3_FILES = \
	start.js \
	node_modules/d3/src/xhr/xhr.js \
	end.js

index.js: $(D3_FILES)
	node_modules/.bin/smash $(D3_FILES) > $@
