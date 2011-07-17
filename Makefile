TESTFOLDER := tests/
LIBFOLDER := lib/

TESTFILES := $(wildcard $(TESTFOLDER)Test-*.js)
TESTFILENAMES := $(notdir $(TESTFILES))

FILES := $(wildcard $(LIBFOLDER)*.js)

.PHONY : all tests docs
all: tests docs
	
tests:
	@echo \#\#\# START TESTS \#\#\#
	@for file in $(TESTFILENAMES); do \
                echo \#\#\# $$file \#\#\#; \
                node $(TESTFOLDER)$$file; \
        done
	@echo \#\#\# END TESTS \#\#\# 
	@echo `echo "\033[33;32m### SUCCESS ###\033[33;0m"`
docs:
	@echo \#\#\# START DOCS \#\#\#
	@echo `touch ../tempindex.html`
	@echo `dox -t 'GridFS' \
	-d 'Simple GridFS capabilities built on [node-mongodb-native]\
	(https://github.com/christkv/node-mongodb-native "node-mongodb-native").' \
	$(FILES) > ../tempindex.html`
	@echo `git checkout -q gh-pages`
	@echo `mv ../tempindex.html index.html`
	@echo `git add index.html`
	@echo `git commit -q -m 'Updated docs.'`
	@echo `git push origin gh-pages`
	@echo `git checkout -q master` 
	@echo \#\#\# END DOCS \#\#\#
	@echo `echo "\033[33;32m### SUCCESS ###\033[33;0m"`

