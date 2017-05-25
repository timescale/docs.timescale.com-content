# README #

This is the source for content for docs.timescaledb.com.  
The docs site uses this repo as a submodule and converts the files directly into
pages using a bash script and markdown parser.

All files are written in standard markdown.

### A note on anchors

If you want to link to a specific part of the page from the docs sidebar, you
need to place an anchor `<a id="anchor_name"></a>`.  Do not use `name` in place
of `id` or it will disrupt the javascript scrolling method that has been set up
in the docs.

### A note on code blocks
When showing commands being entered from a command line, do not include a
character for the prompt.  Do this:

```bash
some_command
```

instead of this:
```bash
$ some_command
```

or this:
```bash
> some_command
```

Otherwise the code highlighter may be disrupted.
