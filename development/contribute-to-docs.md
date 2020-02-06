Timescale documentation is hosted in a [GitHub repository][timescale-docs-github] 
and is open for contribution from all community members. If you 
find errors or would like to add content to our docs, this tutorial 
will walk you through the process.

## Making minor changes
If you want to make only minor changes to docs, you can make corrections 
and submit pull requests on the GitHub website. Go to the file you want to 
correct and click the 'pencil' icon to edit. Once done, GitHub gives you 
an option to submit a pull request at the bottom of the page.

## Making larger contributions to docs
In order to modify documentation, you should have a working knowledge 
of [git][install-git] and [Markdown][markdown-tutorial]. You will 
also need to create a GitHub account.

Be sure to read the [Timescale docs contribution styleguide][timescale-docs-style]. 
You’ll see information about how we refer to aspects of Timescale, 
how we format our docs, and special Markdown tags available to 
you as you author your contribution.

Before we accept any contributions, Timescale contributors need to
sign the Contributor License Agreement (CLA). By signing a CLA, we 
can ensure that the community is free and confident in its
ability to use your contributions. You will be prompted to sign the
CLA during the pull request process.

### Clone the documentation repository
Timescale documentation is in the `docs.timescale.com-content` 
[repository][timescale-docs-github]. You can clone this repository from 
the command line like so:

```bash
git clone git@github.com:timescale/docs.timescale.com-content.git
```

Outside contributors will have to push their changes to a branch. You 
will need to fork the repository, then pull from your fork, make changes to 
a branch, then push changes to a branch on your fork. From there, you can 
submit a pull request. See the GitHub instructions on 
[collaborating with pull requests][github-collaborating-instructions] for 
more details.

Once cloned, you should be able to open the entire Timescale 
documentation repository in a code editor of your choice.

You can create a new branch in git as well:

```bash
git checkout -b my-branch-name
```

### Modifying a file

Once you’re in your new branch you can start editing your doc as you normally would.

At any time, you can see which files have been edited with the following git command:

```bash
git status
```

### Adding a new item to the page structure

Often, you may want to add a new file to Timescale docs. To do so, you must 
edit the `page-index/page-index.js` file. You should be able to glean 
which lines to add and how to modify them based on the existing structure of 
the file. If you need help, let us know in the 
[Timescale community Slack][timescale-slack].

### Submitting a pull request

A pull request is a method of submitting contributions to an open development 
project. It occurs when a developer asks for changes committed to an external 
repository to be considered for inclusion in a project's main repository after 
the review.

Once you’ve completed all of your edits and are ready to submit a pull request, 
you will first need to add all your edited files to your branch:

```bash
git add .
```

Now, you need to commit your changes along with a message explaining what changes 
you’ve made to the repository. Your commit message should start with an active verb
and longer descriptions should be in the body of your commit message.

```bash
git commit -m “Add a better description of what a feature does”
```

Then you have to upload your changes to GitHub:

```bash
git push origin my-branch-name
```

You will then need to complete the process on the 
[Timescale Docs GitHub repository][timescale-docs-github]. Click on 
the `New Pull Request` button and follow the instructions to create a 
pull request using the branch you uploaded.

### Making changes to a pull request

Typically, you’ll be asked to make some changes to your pull request. You 
can do so locally and re-add your changes to your branch and re-upload 
it using the following commands:

```bash
git add .
git commit --amend
git push -f origin my-branch-name
```

Note that using `git amend` and force pushing are our preferred methods 
because this is content and not code.

Then go back to the specific pull request page in the 
[Timescale Docs GitHub repository][timescale-docs-github] 
and request another review by clicking the “cycle” button next 
to the reviewer’s name.

You may go through several such review cycles, which is normal.

### Wrapping up

After your pull request has been approved, you will have to go to the
Pull Requests tab on the [Timescale Docs GitHub repository][timescale-docs-github]
and click the "Rebase and merge" button.

Once you’re done and your pull request has been merged, you can clean up 
your workspace by first going back to the master branch and re-fetching the 
repository as it is stored on GitHub. This will not only get all changes 
you’ve made, but also all changes other people have made to the repository.

```bash
git checkout master
git fetch origin && git reset --hard origin/master && git clean -f -d
```

[timescale-docs-github]: https://github.com/timescale/docs.timescale.com-content
[install-git]: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
[markdown-tutorial]: https://www.markdownguide.org/basic-syntax/
[timescale-docs-style]: https://github.com/timescale/docs.timescale.com-content/blob/master/README.md
[github-collaborating-instructions]: https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request
[timescale-slack]: https://timescaledb.slack.com/archives/CRG0JJ6AF
[timescale-github-cla]: https://cla-assistant.io/timescale/docs.timescale.com-content
