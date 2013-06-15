TESTFOLDER := test/
LIBFOLDER := lib/

TESTFILES := $(wildcard $(TESTFOLDER)Test-*.js)
TESTFILENAMES := $(notdir $(TESTFILES))

FILES := $(wildcard $(LIBFOLDER)*.js)

.PHONY : all test docs
all: test docs

test:
	@echo \#\#\# START TESTS \#\#\#
	@for file in $(TESTFILENAMES); do \
                echo \#\#\# $$file \#\#\#; \
                node $(TESTFOLDER)$$file; \
        done
	@echo \#\#\# END TESTS \#\#\#
	@echo `echo "\033[33;32m### SUCCESS ###\033[33;0m"`
docs:
	@echo \#\#\# START DOCS \#\#\#
	@echo `docco lib/*`
	@echo `git checkout -q gh-pages`
	@echo `git add docs/`
	@echo `git commit -q -m 'Updated docs.'`
	@echo `git push -q origin gh-pages`
	@echo `git checkout -q master`
	@echo \#\#\# END DOCS \#\#\#
	@echo `echo "\033[33;32m### SUCCESS ###\033[33;0m"`

