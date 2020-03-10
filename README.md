# README #

This is the source for content for docs.timescale.com.
The docs site uses this repo as a submodule and converts the files directly into
pages using a bash script and markdown parser.

All files are written in standard markdown.

## Contributing

We welcome and appreciate any help the community can provide to make
TimescaleDB's documentation better!

You can help either by opening an
[issue](https://github.com/timescale/docs.timescale.com-content/issues) with
any suggestions or bug reports, or by forking this repository, making your own
contribution, and submitting a pull request.

Before we accept any contributions, Timescale contributors need to
sign the [Contributor License Agreement](https://cla-assistant.io/timescale/docs.timescale.com-content) (CLA).
By signing a CLA, we can ensure that the community is free and confident in its
ability to use your contributions.

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
1. Use single quotes when referring to the object of a user interface action.
For example: Click 'Get started' to proceed with the tutorial.

<style>
  table br {
    display: block !important;
  }
</style>

## Special rules
There are some custom modifications to the markdown parser to allow for special
formatting within the docs.

- [SSS](#sss)
- [Tip callout](#tip-callout)
- [Warning callout](#warning-callout)
- [TopList](#toplist)
- [Important header](#important-header)
- [Footer link](#footer-link)
- [Download link](#download-link)
- [Version link](#version-link)
- [PG version](#pg-version)
- [Designating functions](#designating-functions)
- [Multiple language example](#multiple-language-example)
- [Card grid](#card-grid)

_Make sure to include the space after the formatting command!_

**Warning**: Note the single space required in the special formats before adding
normal text. Adding ':TIP:' or ':WARNING:' to the start of any standard paragraph will
result in non-optimal html.  The characters will end up on the outside of the
paragraph tag.  This is due to the way that the markdown parser interprets
blockquotes with the new modifications.
This will be fixed in future versions if it becomes a big issue, but we don't
anticipate that.

### SSS
Adding `sss ` to the start of every list item in an ordered list will result in a switch to "steps" formatting which is used to denote instructional steps, as for a tutorial.

---  

### Tip callout
Adding `>:TIP: ` to the start of a blockquote (using '>') will create a "tip" callout.

**Markdown**
```markdown
>:TIP: If you are planning on doing any performance testing on TimescaleDB, 
we strongly recommend that you [configure][] TimescaleDB properly.
```

**Output**

<img src="https://assets.timescale.com/docs/images/docs-tip-example.png" width="600" />

---

### Warning callout
Adding `>:WARNING: ` to the start of a blockquote (using '>') will create a "warning" callout.
    
**Markdown**
```markdown
>:WARNING: Starting in v0.12.0, TimescaleDB enables[telemetry reporting][] by default. You can 
opt-out by following the instructions detailed in our[telemetry documentation][]. However, please 
do note thattelemetry is anonymous, and by keeping it on, you help us[improve our product][].
```

**Output**

<img src="https://assets.timescale.com/docs/images/docs-warning-example.png" width="600" />

---
    
### Toplist
Adding `>:TOPLIST: ` as the first line of a blockquote (using '>') will
create a fixed right-oriented box, useful for a table of contents or list of
functions, etc.  See the FAQ page (faq.md) for an example.
   - The first headline in the toplist will act as the title and will be separated from the remainder of the content stylewise (on the FAQ page, it's the headline "Questions").
   - Everything else acts as a normal blockquote does.

**Markdown**

```markdown
>:TOPLIST:
> ### Command List (A-Z)
> - [add_dimension](#add_dimension) 
> - [add_drop_chunks_policy](#add_drop_chunks_policy)
> - [add_reorder_policy](#add_reorder_policy)
> -   [add_compress_chunks_policy](#add_compress_chunks_policy)
> - [alter_job_schedule](#alter_job_schedule)
> - [alter table (compression)](#compression_alter-table) 
> - [alter view (continuous aggregate)](#continuous_aggregate-alter_view)
> - [attach_tablespace](#attach_tablespace)
> - [chunk_relation_size](#chunk_relation_size)
> - ...
```

**Output**

<img src="https://assets.timescale.com/docs/images/docs-toplist-example.png" width="300" />
    
---

### Important header

Adding a text free link to a header with a text address (Ex. `## Important Header [](indexing)`) will create an anchor icon that links to that header with the hash name of the text.

**Markdown**

<pre><code>&#35;&#35; Recommended: `timescaledb-tune` &lsqb;](ts-tune)</pre></code>

**Output**

<img src="https://assets.timescale.com/docs/images/docs-important-header-example.png" width="300" />

---

### Footer link
Adding `:FOOTER_LINK: ` to the start of a paragraph(line) will format it as a "footer link".

---

### Download link
Adding `:DOWNLOAD_LINK: ` to the start of a link will append a 'download link' icon to the end of the link inline.

**Markdown**

```markdown
Schema creation script: [:DOWNLOAD_LINK: `schema.sql`][schema-creation]
```

**Output**

<img src="https://assets.timescale.com/docs/images/docs-download-link-example.png" width="300" />

---

### Version link

Adding `x.y.z` anywhere in the text will be replaced by the version number of the branch.  Ex. `look at file foo-x.y.z` >> `look at file foo-0.4.2`.

---

### Pg version
Adding `:pg_version:` to text displayed in an installation section (i.e. any page with a filename beginning `installation-`) will display the PostgreSQL version number.  This is primarily to be used for displayed filenames in install instructions that need to be modular based on the version.

---

### Designating functions
   + Adding `:community_function:` to a header (for example, in the api section) adds decorator text "community function".
   + Adding `:enterprise_function:` to a header adds decorator text "enterprise function".

**Markdown**

<pre><code>&#35;&#35; add_compress_chunks_policy() :community_function: [](add_compress_chunks_policy)
&#35;&#35; add_compress_chunks_policy() :community_function: [](add_compress_chunks_policy)
</code></pre>

**Output**

<img src="https://assets.timescale.com/docs/images/docs-community-edition-example.png" width="550" />

<img src="https://assets.timescale.com/docs/images/docs-enterprise-edition-example.png" width="400" />

---

### Multiple language example
Wrapping multiple triple tick (&#96;&#96;&#96;) code blocks with  a `<multiple-code-examples>...</multiple-code-examples>`  node will result in a tabbed outputted component
- You must include the language of the code block in the opening triple tick (For example &#96;&#96;&#96;sql)
- Make sure that there is newline after `<multiple-code-examples>` and before `</multiple-code-examples>`

**Markdown**

<pre><code>&lt;multiple-code-examples>
&nbsp;
&#96;&#96;&#96;js
const foo = 'bar'
&#96;&#96;&#96;
&#96;&#96;&#96;php
$foo = 'bar'
&#96;&#96;&#96;
&#96;&#96;&#96;java
String foo = 'bar'
&#96;&#96;&#96;
&#96;&#96;&#96;python
let foo = 'bar'
&#96;&#96;&#96;
&nbsp;
&lt;/multiple-code-examples>
</code></pre>

**Output**

<img src="https://assets.timescale.com/docs/images/docs-multiple-language-example.png" />

---

### Card grid

Wrapping a list with `<card-grid>...</card-grid>` will style each list item as a card.  It will style anything bolded as the title on the card (see below for styles.

- Make sure that there is newline after `<card-grid>` and before `</card-grid>`
- You can add a `columns` attribute to the open `card-grid` tag to specify how many 

**Markdown**

```markdown
<card-grid>

- ![](...image url...) **[Start Here - Hello NYC]
  [Hello NYC]** If you are new to TimescaleDB or 
  even SQL, check out our  tutorial with NYC taxicab 
  data to get an idea of the capabilities our database
  has to offer.
- ![(...image url...) **[Geospatial data][postGIS]** 
  If you want to delve into the further potential 
  of TimescaleDB, we have guidance for more advanced
  topics like PostGIS integration.

</card-grid>
```

**Output**

<img src="https://assets.timescale.com/docs/images/docs-card-grid-example.png" width="600" />

### Editing the API section

There is a specific format for the API section which consists of:
- **Function name** with empty parentheses (if function takes arguments). Ex. `add_dimension()`
- A brief, specific description of the function
- Any warnings necessary
- **Required Arguments**
    - A table with columns for "Name" and "Description"
- **Optional Arguments**
    - A table with columns for "Name" and "Description"
- Any specific instructions about the arguments, including valid types
- **Sample Usage**
    - One or two literal examples of the function being used to demonstrate argument syntax.

See the API file to get an idea.
