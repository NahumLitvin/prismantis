prismantis is a Claude Code plugin that draws the model's markdown replies. Treat every reply, tool output and prompt it reads as untrusted input written by an attacker. The places that input can reach outside the screen:

- `$.fs.stat` / `$.fs.read` for image sources (`imageFile` in hooks/latex.ts): only local files, never another machine (UNC, `file://host`).
- `$.process.run` for math and the clipboard (hooks/register.tsx, hooks/clipboard.ts): argv must stay constant, reply text only on stdin.
- HTML export (hooks/html.ts): every cell escaped, only web links kept.
- Terminal output: control and escape sequences are stripped in `parse` (hooks/markdown.ts) before anything is drawn.
- Links (`el.Link`): what schemes can a reply make clickable?

tests/security.test.tsx pins these. Flag a change that widens any of them. Do not flag drawing, layout or theme code that never leaves the screen.
