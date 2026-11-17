# Copy Freedom

Four local Photoshop copy tools, extracted from FNX img freedom into an independent panel.

## Install on Windows

1. [Download the ZIP](https://github.com/atrasa/copy-freedom/archive/refs/heads/main.zip).
2. Right-click the ZIP and choose **Extract All**. Open the extracted folder.
3. Double-click **Install Copy Freedom.cmd**. No Node.js, developer tools or administrator account is required.
4. Restart Photoshop when convenient. Open **Window > Extensions (Legacy) > Copy Freedom**.

Windows 10/11 and desktop Photoshop 2024 or newer with CEP support are required. Tested with Photoshop 2026 on Windows. macOS is not supported.

The launcher installs to `%APPDATA%\Adobe\CEP\extensions\com.finex.copyfreedom`. It enables Adobe's unsigned CEP panel loading (`PlayerDebugMode=1` for CSXS 11 and 12), backs up previous settings and any previous Copy Freedom installation under the extensions folder's `_backup`, and unblocks the installed files. This setting permits other unsigned CEP panels too. It never closes Photoshop or saves documents. A reinstall backs up the existing Copy Freedom files first.

If Windows blocks the downloaded launcher, inspect the files first; if you trust this download, use the file's Properties > Unblock option and try again. Managed PCs may require IT approval. The launcher and bundled local clipboard helper use a process-only PowerShell execution-policy bypass; they do not change your machine's execution policy.

## The four buttons

| Button | Result |
| --- | --- |
| Copy layer | Selected layers/groups as image pixels, cropped to their combined bounds. |
| Copy canvas | Visible artwork inside the current artboard, or the full normal canvas. |
| Copy area | Visible merged artwork inside a marquee/lasso selection, including feathering. |
| Copy area + new layer area | Copies the area, then adds a merged visible-composite layer above the current layer with a selection mask. Undo the added layer with Ctrl+Z. |

Paste the image into ChatGPT, Flow or another image-capable app with **Ctrl+V**. Copy replaces your clipboard content. For the fourth button, select one current layer inside the artboard (or a normal document layer) and draw a pixel selection first. If the document changes during copying, the new-layer action is rejected; the copied image remains available.

Everything runs locally. The plugin uses temporary PNGs and Windows PNG/Bitmap clipboard formats; no uploads, accounts or network service. Temporary renders close without saving changes to the source. The first three buttons preserve source layers and marquee; the fourth intentionally adds one layer and mask. Color output is RGB, 8 bits per channel. Clipboard transparency depends on the destination application's clipboard support.

## Separate from FNX img freedom

Copy Freedom uses its own folder, CEP IDs, JavaScript globals and scratch filenames. It can be installed alongside FNX img freedom. Export, board, alignment, splitting and other FNX features are excluded. No FNX files are changed by this project or installer.

## Checks

With Node.js installed, run `npm test` (no dependencies to install). For the Windows clipboard integration check, run `powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File tests/clipboard-windows.ps1` from this folder. It restores the original clipboard afterward. `tests/in-host.jsx` is the Photoshop synthetic integration test; adjust its two local source paths before running on another machine. It creates and closes a disposable document without saving user documents.

Installation follows [Adobe's CEP cookbook](https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_12.x/Documentation/CEP%2012%20HTML%20Extension%20Cookbook.md). Panels appear in [Photoshop's Extensions (Legacy) menu](https://helpx.adobe.com/photoshop/desktop/app-integrations/supported-plugins-and-extensions.html).
