TESTFILES := $(wildcard test/Test-*.js)
TESTFILENAMES := $(notdir $(TESTFILES))

FILES := $(wildcard *.js)

.PHONY : tests docs
tests:
	@echo \#\#\# START \#\#\#
	@for file in $(TESTFILENAMES); do \
                echo \#\#\# $$file \#\#\#; \
                node test/$$file; \
        done
	@echo \#\#\# END \#\#\# 
	@echo `echo "\033[33;32m### SUCCESS ###\033[33;0m"`
docs:
	@echo `dox -t 'GridFS' \
	-d 'Simple GridFS capabilities built on [node-mongodb-native]\
	(https://github.com/christkv/node-mongodb-native "node-mongodb-native").' \
	$(FILES)`


