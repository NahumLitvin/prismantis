---
name: demo
description: Print the prismantis demo reply to eyeball every rendering feature after a change. Use after any visual change, when asked for "the demo", "show all features", "visual test", or before a release screenshot.
---

# Demo

The visual test. Unit tests prove the tree; this proves the look.

1. **Load the working copy** in this session (see `live-check` step 1). The new version shows only after the turn that made the edit ends.
2. **Print `docs/demo.md` verbatim as the whole final message of a turn**, with nothing before it and no tool call after it. Claude Code condenses text written right before a tool call, so the demo must close the turn.
3. **The person looks at it**, or screenshots it on the next turn (`live-check` step 3). Check:
   - `prismantis` in a heavy box on the first line, and `Roster` with a heavy rule under it
   - the table: yellow header, rules between rows, the right-aligned `Size` column, colored numbers
   - the Attachments table: with the default `tableLayout` `classic` its columns sit at their longest words, so the scroll path and checksum keep whole and their cells wrap beside them; with `tableLayout` `auto` or `stacked` set in `/config` it draws as one card per row, each line a bold `Scroll` or `Checksum` label against its value, with labels padded to one width
   - the Status matrix table: with the default `statusMatrix` `off` it draws as written; set `color` in `/config` and its Result column draws in theme colors — the `✓` rows green, `failed` in the reddest accent, `pending` dim gray, those three different from each other; with `summary` a count line under the table, with `group` the rows reordered and a heavy rule where the status changes
   - the four diagrams and the table on one row on a wide terminal, wrapping on a narrow one
   - every flowchart box and sequence participant in its own color, with matching colors at both ends of the sequence
   - a value above each bar, the tallest bar highlighted and the rest muted, labels without quotes, dim gridlines, colored axis numbers
   - the quadrant chart: `│` and `─` axes crossing in the diagram color, `▲ Fun` above and `▼ Dull` below, the four quadrant names in their corners, markers `1` `2` `3` in three palette colors with the same colors on their numbers in the legend line under `◄ Easy` and `Hard ►`
   - the mind map: `Trip` on the left in the accent color, `Clothes`, `Food` and `Night gear` each in its own palette color with their connectors and leaves' arms in that color, joined to the root by `┌` `┼` `└` in the diagram color
   - the journey: `Start ───` and `Run ───` over their tasks in two palette colors, a mood line in the diagram color stepping between rows `5` and `1` with rounded corners, the `Park loop` dot green, `Alarm` and `Hill` red, `Stretch` plain, task names centered under their dots and `Me, Dog` under `Park loop`
   - the kanban board: `To pack · 2`, `Packing · 1` and `Packed · 0` side by side in three palette colors, each card a rounded box in its column's color with the task text inside, `Bo · Very High` with `Very High` in red, `CAMP-3` and `Mei` in the diagram color, and the empty `Packed` column with no cards
   - the git graph: three lanes top to bottom, `main`, `edits` and `art` each in its own palette color (also in the legend under it), `├──╮` where a branch starts with its name beside it, `typos` as `■`, `merge art` in the diagram color where the `art` lane ends in `╯`, and `[v0.1]` `[v1.0]` tags in the accent color
   - shell colors: command, flags, the quoted string, `&&`
   - code blocks with a language header and no frame, and Prism colors in the TypeScript block
   - path, link and inline-code colors, the paths opening their files on click in a terminal that draws hyperlinks while `/kick` stays unlinked text, the quote bar running down its paragraph and both list rows, and the green `Tip` alert box
   - accent `⧉ md`, `⧉ art` and `⧉ html` buttons on the table (`⧉ html` in a local macOS or Linux terminal only), and an accent `[ ⧉ copy ]` button on every diagram, the list, the shell block, the alert and the quote
   - the timeline figure: drawn line by line with no `── figure` header, the caption in the comment color, the `▏───▏` axis and the Provider bar in the diagram color, `✗` and `2 twice` in the theme's reddest accent color, the Handler bar and `1` in its greenest, the time labels in its most amber, those three different from each other and from the diagram color, the bars ending on the axis ticks, `⧉ source` and `⧉ art` above it
   - the Hebrew section: lines read right to left (the first bullet shows `eu-west` and `us-east` after the Hebrew, mirrored parentheses), bullets and `1.` on the right, the quote bar on the right, the table cells right aligned, and the shell comment reversed while `ls -la` stays
4. **Fix what looks wrong**, then run the demo again.
5. **Keep it current.** A new feature adds a line to `docs/demo.md` and to the checklist above. All data stays invented and neutral.
