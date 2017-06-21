# README #

This is the source for content for docs.timescaledb.com.  
The docs site uses this repo as a submodule and converts the files directly into
pages using a bash script and markdown parser.

All files are written in standard markdown.

### A note on inline-code, links and inline formatted text

Due to a quirk of HTML, if you have either inline code (text surrounded by one backtick) 
or a markdown link (brackets around the link text), or formatted text 
(**strong**, or _italics_) as the first or last item on a line, the previous or 
next word respectively will not have a space between the item and itself.  

For example this sentence `will`
not have a space between the inline coded 'will' and the word 'not.'  To avoid this, 
just make sure that a link or inline code phrase is not at the front or back of a line.

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

### Special rules
There are some custom modifications to the markdown parser to allow for special
formatting within the docs.  

+ Adding 'vv ' to the start of every list item in an ordered list will result in
  a switch to "steps" formatting which is used to denote instructional steps, as
  for a tutorial.
+ Adding '>ttt ' to the start of a blockquote (using '>') will create a "tip" callout.
+ Adding '>vvv ' to the start of a blockquote (using '>') will create a "warning" callout.
+ Adding 'fff ' to the start of a paragraph(line) will format it as a "footer link".
+ Adding 'ddd ' to the start of a link will append a 'download link' icon to the end of the link inline.

_Make sure to include the space after the formatting command!_

**Warning**: Note the single space required in the special formats before adding
normal text. Adding 'ttt' or 'vvv' to the start of any standard paragraph will
result in non-optimal html.  The characters will end up on the outside of the
paragraph tag.  This is due to the way that the markdown parser interprets
blockquotes with the new modifications.  
This will be fixed in future versions if it becomes a big issue, but we don't
anticipate that.
