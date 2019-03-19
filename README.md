# README #

This is the source for content for docs.timescale.com.
The docs site uses this repo as a submodule and converts the files directly into
pages using a bash script and markdown parser.

All files are written in standard markdown.

## Docs versions

There is a version of the docs for each supported version of the database, stored in
a separate git branch.  Our docs site parses those branches to allow users to choose
what version of the docs they want to see.  When submitting pull requests, you should determine
what versions of the docs your changes will apply to and attach a label to the pull request
that denotes the earliest version that your changes should apply to (`0.9`, `0.10`, `1.0`, etc.)
The admin for the docs will use that as a guide when updating version branches.

### A note on page links

None of the internal page links within these files will work on GitHub.  They are designed to function within the code for the documentation site at [docs.timescale.com](http://docs.timescale.com).  All external links should work.

### A note on anchors

If you want to link to a specific part of the page from the docs sidebar, you
need to place a special anchor `[](anchor_name)`.

**Your anchor name must be unique** in order for the highlight scrolling to work properly.

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

### General formatting conventions

To maintain consistency, please follow these general rules.
1. Make sure to add line breaks to your paragraphs so that your PRs are readable
in the browser.
1. All links should be reference-style links where the link address is at the
bottom of the page.  The only exceptions are links to anchors on the same page
as the link itself.
1. All functions, commands and standalone function arguments (ex. `SELECT`,
`time_bucket`) should be set as inline code within backticks ("\`command\`").
1. Functions should not be written with parentheses unless the function is
being written with arguments within the parentheses.
1. "PostgreSQL" is the way to write the elephant database name, rather than
"Postgres".  "TimescaleDB" refers to the database, "Timescale" refers to the
company.

### Special rules
There are some custom modifications to the markdown parser to allow for special
formatting within the docs.

+ Adding 'sss ' to the start of every list item in an ordered list will result in
  a switch to "steps" formatting which is used to denote instructional steps, as
  for a tutorial.
+ Adding '>:TIP: ' to the start of a blockquote (using '>') will create a "tip" callout.
+ Adding '>:WARNING: ' to the start of a blockquote (using '>') will create a "warning" callout.
+ Adding '>:TOPLIST: ' as the first line of a blockquote (using '>') will
create a fixed right-oriented box, useful for a table of contents or list of
functions, etc.  See the FAQ page (faq.md) for an example.
    - The first headline in the toplist will act as the title and will be separated from the remainder of the content stylewise (on the FAQ page, it's the headline "Questions").
    - Everything else acts as a normal blockquote does.
+ Adding a text free link to a header with a text address (Ex. `## Important Header [](indexing)`) will create an anchor icon that links to that header with the hash name of the text.
+ Adding ':FOOTER_LINK: ' to the start of a paragraph(line) will format it as a "footer link".
+ Adding ':DOWNLOAD_LINK: ' to the start of a link will append a 'download link' icon to the end of the link inline.
+ Adding 'x.y.z' anywhere in the text will be replaced by the version number of the branch.  Ex. `look at file foo-x.y.z` >> `look at file foo-0.4.2`.

_Make sure to include the space after the formatting command!_

**Warning**: Note the single space required in the special formats before adding
normal text. Adding 'ttt' or 'vvv' to the start of any standard paragraph will
result in non-optimal html.  The characters will end up on the outside of the
paragraph tag.  This is due to the way that the markdown parser interprets
blockquotes with the new modifications.
This will be fixed in future versions if it becomes a big issue, but we don't
anticipate that.

### Editing the API section

There is a specific format for the API section which consists of:
- Function name with empty parentheses (if function takes arguments). Ex. `add_dimension()`
- Brief, specific description of the function
- Any warnings necessary
- Required Arguments
    - A table with columns for "Name" and "Description"
- Optional Arguments
    - A table with columns for "Name" and "Description"
- Any specific instructions about the arguments, including valid types
- Sample Usage: one or two literal examples of the function being used to demonstrate argument syntax.

See the API file to get an idea.
