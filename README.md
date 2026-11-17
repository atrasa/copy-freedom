# Copy Freedom

Four local Photoshop copy tools, extracted from FNX img freedom into an independent panel.

## Which file do I double-click?

Extract the entire ZIP first, then choose the launcher for your computer:

| Computer | Double-click |
| --- | --- |
| Windows | **Install Copy Freedom.cmd** |
| Mac | **Install Copy Freedom.command** |

Both launchers are included in the same package. After installation, restart Photoshop and open **Window > Extensions (Legacy) > Copy Freedom**. Keep the extracted folder together; the launcher needs the other files beside it.

## Install on Windows

1. [Download the ZIP](https://github.com/atrasa/copy-freedom/archive/refs/heads/main.zip).
2. Right-click the ZIP and choose **Extract All**. Open the extracted folder.
3. Double-click **Install Copy Freedom.cmd**. No Node.js, developer tools or administrator account is required.
4. Restart Photoshop when convenient. Open **Window > Extensions (Legacy) > Copy Freedom**.

Windows 10/11 and desktop Photoshop 2024 or newer with CEP support are required. Tested with Photoshop 2026 on Windows.

The launcher installs to `%APPDATA%\Adobe\CEP\extensions\com.finex.copyfreedom`. It enables Adobe's unsigned CEP panel loading (`PlayerDebugMode=1` for CSXS 11 and 12), backs up previous settings and any previous Copy Freedom installation under the extensions folder's `_backup`, and unblocks the installed files. This setting permits other unsigned CEP panels too. It never closes Photoshop or saves documents. A reinstall backs up the existing Copy Freedom files first.

If Windows blocks the downloaded launcher, inspect the files first; if you trust this download, use the file's Properties > Unblock option and try again. Managed PCs may require IT approval. The launcher and bundled local clipboard helper use a process-only PowerShell execution-policy bypass; they do not change your machine's execution policy.

## Install on Mac (new; awaiting a real Mac test)

The Mac version uses the built-in macOS clipboard API through `osascript`; no PowerShell, Homebrew, Xcode or Node.js is required. The installer and native clipboard behavior have not yet been verified on a real Mac. Photoshop must support CEP/Extensions (Legacy); availability depends on your Photoshop version and how it is launched.

1. [Download the ZIP](https://github.com/atrasa/copy-freedom/archive/refs/heads/main.zip) and double-click it to extract the entire folder.
2. Open the extracted folder and double-click **Install Copy Freedom.command**. Terminal opens and installs the panel for your user; no administrator password is needed.
3. If macOS blocks it, inspect the script first. If you trust it, use **System Settings > Privacy & Security > Open Anyway**, when offered. If Terminal says permission denied, open Terminal, type `bash ` (with a space), drag **Install Copy Freedom.command** into Terminal and press Return. This also works if the ZIP extractor did not retain its executable permission.
4. Restart Photoshop when convenient, then open **Window > Extensions (Legacy) > Copy Freedom**.
5. Copy an image and paste with **Cmd+V**. Undo the fourth button's added layer with **Cmd+Z**.

The installer places the panel at `~/Library/Application Support/Adobe/CEP/extensions/com.finex.copyfreedom`, backs up previous Copy Freedom files and Adobe CEP preferences in the neighboring `_backup` folder, and enables unsigned panels for CSXS 11 and 12. This allows other unsigned CEP panels too. It removes the quarantine attribute only from this plugin's installed files. It never restarts Photoshop, saves your documents or changes FNX img freedom. Managed Macs may require IT approval.

If the panel is missing, confirm that your Photoshop installation supports CEP panels. If macOS requests permission to paste, allow it for the app performing the paste. Clipboard PNG and TIFF formats preserve image pixels; each destination app decides which format it accepts. With Universal Clipboard or clipboard-history apps enabled, copied images may also be synchronized or retained by those system/third-party features.

## The four buttons

| Button | Result |
| --- | --- |
| Copy layer | Selected layers/groups as image pixels, cropped to their combined bounds. |
| Copy canvas | Visible artwork inside the current artboard, or the full normal canvas. |
| Copy area | Visible merged artwork inside a marquee/lasso selection, including feathering. |
| Copy area + new layer area | Copies the area, then adds a merged visible-composite layer above the current layer with a selection mask. Undo the added layer with Ctrl+Z (Windows) or Cmd+Z (Mac). |

Paste the image into ChatGPT, Flow or another image-capable app with **Ctrl+V** (Windows) or **Cmd+V** (Mac). Copy replaces your clipboard content. For the fourth button, select one current layer inside the artboard (or a normal document layer) and draw a pixel selection first. If the document changes during copying, the new-layer action is rejected; the copied image remains available.

Everything runs locally. The plugin uses temporary PNGs and Windows PNG/Bitmap or macOS PNG/TIFF clipboard formats; no uploads, accounts or network service. Temporary renders close without saving changes to the source. The first three buttons preserve source layers and marquee; the fourth intentionally adds one layer and mask. Color output is RGB, 8 bits per channel. Clipboard transparency depends on the destination application's clipboard support.

## Separate from FNX img freedom

Copy Freedom uses its own folder, CEP IDs, JavaScript globals and scratch filenames. It can be installed alongside FNX img freedom. Export, board, alignment, splitting and other FNX features are excluded. No FNX files are changed by this project or installer.

## Checks

With Node.js installed, run `npm test` (no dependencies to install). For the Windows clipboard integration check, run `powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File tests/clipboard-windows.ps1` from this folder. It restores the original clipboard afterward. The Mac helper is covered by platform mocks in `npm test`. Run `npm run test:mac-installer` with Bash available (Git Bash on Windows) to exercise an isolated installer with mocked macOS preference commands. Native macOS paste and installer execution remain unverified. `tests/in-host.jsx` is the Photoshop synthetic integration test; adjust its two local source paths before running on another machine. It creates and closes a disposable document without saving user documents.

Installation follows [Adobe's CEP cookbook](https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_12.x/Documentation/CEP%2012%20HTML%20Extension%20Cookbook.md). Panels appear in [Photoshop's Extensions (Legacy) menu](https://helpx.adobe.com/photoshop/desktop/app-integrations/supported-plugins-and-extensions.html).

The Mac clipboard helper uses [Apple’s NSPasteboard API](https://developer.apple.com/documentation/appkit/nspasteboard).
