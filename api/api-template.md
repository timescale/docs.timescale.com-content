<!-- REMOVE ALL COMMENTS AFTER FILLING OUT TEMPLATE-->
<!-- Add your function name in the headline below with an accompanying anchor name.  The anchor should be the same as the function name-->
## function_name() [](function_name) 

<!-- 
Include a description of the function here.  It should succinctly describe what the function does and any important considerations with regards to function usage.  Include a link to the relevant section in Using TimescaleDB if one exists.
-->


<!-- Include a table with required arguments, including a name and description with type (e.g. REGCLASS, INTEGER)-->
#### Required Arguments [](function_name-required-arguments)

| Name                 | Description                                       |
|----------------------|---------------------------------------------------|
| `sample_argument`    | (TYPE) Quick and clear description of the argument|
| `another_argument`   | (TYPE) This argument description spans more than one line, but that's ok as long as there is an ending symbol |


<!-- Include a table of optional arguments if there are any, otherwise do not include this section in your entry -->
#### Optional Arguments [](function_name-optional-arguments)

| Name                 | Description                                       |
|----------------------|---------------------------------------------------|
| `third_argument`    | (TYPE) Quick and clear description of the argument|
| `fourth_argument`   | (TYPE) This argument description spans more than one line, but that's ok as long as there is an ending symbol |


<!-- Include a table of what the function returns, if appropriate, otherwise do not include this section in your entry-->
#### Returns [](function_name-returns)

| Column               | Description                                       |
|----------------------|---------------------------------------------------|
| `sample_column`      | Quick and clear description of the column         |
| `another_column`     | Another clear description of a column             |


<!-- Include the most possible errors that the function returns -->
#### Errors/Limitations

- If you have not wargled your foobar, `function_name` will not work.
- If foobar levels are too high `function_name` will respond with `error: something something something`


<!--Include useful examples of the function in use.  Try to include representative examples that cover usage of most/all arguments-->
#### Sample Usage [](function_name-sample-usage)

<!-- For the description, try to start with a present tense verb. For example-->
Create a foobar that wargles the first column in the named table

<!-- Include a code block with the command and sample output (if any)-->
```sql
SELECT function_name('sample_argument', 'another_argument);

--either real output or code block comment that states what output should be
```

<!-- Do NOT include best practices here.  That should be in the Using TimescaleDB section.  -->
