const fs=require('fs'),path=require('path'),os=require('os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'/bin/bash';
const run=fs.mkdtempSync(path.join(os.tmpdir(),'copy-freedom-installer-'));
const shellPath=p=>process.platform==='win32'?p.replace(/\\/g,'/').replace(/^([A-Za-z]):/,(_,d)=>'/'+d.toLowerCase()):p;
const fixture=path.join(run,'download with spaces'),home=path.join(run,'test-user');fs.mkdirSync(fixture);
const files=['index.html','style.css','panel.js','clipboard-image-mac.js','CSXS','host'];
for(const file of files)fs.cpSync(file,path.join(fixture,file),{recursive:true});
const installer=fs.readFileSync('Install Copy Freedom.command','utf8');
// Redirect only the test copy; never repurpose HOME or touch real Adobe preferences.
fs.writeFileSync(path.join(fixture,'Install Copy Freedom.command'),installer.replace('$HOME/Library/','$COPY_FREEDOM_TEST_HOME/Library/'));
fs.writeFileSync(path.join(fixture,'run.sh'),`#!/bin/bash
set -e
defaults() {
 case "$1" in
 read) return 1 ;;
 write) printf '%s\\n' "$*" >> "$COPY_FREEDOM_TEST_LOG" ;;
 *) return 1 ;;
 esac
}
xattr() { return 0; }
export -f defaults xattr
bash "./Install Copy Freedom.command" < /dev/null
`);
function execute(){return spawnSync(bash,['./run.sh'],{cwd:fixture,env:{...process.env,COPY_FREEDOM_TEST_HOME:shellPath(home),COPY_FREEDOM_TEST_LOG:shellPath(path.join(run,'preferences.log'))},encoding:'utf8'});}
let result=execute();assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
const extensions=path.join(home,'Library/Application Support/Adobe/CEP/extensions'),target=path.join(extensions,'com.finex.copyfreedom');
assert.equal(fs.readFileSync(path.join(target,'panel.js'),'utf8'),fs.readFileSync('panel.js','utf8'));
fs.writeFileSync(path.join(target,'panel.js'),'previous install');
result=execute();assert.equal(result.status,0,result.stderr);
const backups=fs.readdirSync(path.join(extensions,'_backup'));assert.equal(backups.length,2);
assert.ok(backups.some(b=>{const p=path.join(extensions,'_backup',b,'com.finex.copyfreedom/panel.js');return fs.existsSync(p)&&fs.readFileSync(p,'utf8')==='previous install';}));
assert.equal(fs.readFileSync(path.join(target,'panel.js'),'utf8'),fs.readFileSync('panel.js','utf8'));
assert.match(fs.readFileSync(path.join(run,'preferences.log'),'utf8'),/write com.adobe.CSXS.12 PlayerDebugMode -string 1/);
fs.renameSync(path.join(fixture,'panel.js'),path.join(fixture,'panel.js.missing'));
result=execute();assert.notEqual(result.status,0);assert.match(result.stderr,/Extract the entire ZIP/);
assert.equal(fs.readFileSync(path.join(target,'panel.js'),'utf8'),fs.readFileSync('panel.js','utf8'));
console.log('PASS: Mac installer shell executes with mocked macOS preferences; spaces in paths, first install, reinstall backup and incomplete ZIP rejection. Fixture retained at '+run);
