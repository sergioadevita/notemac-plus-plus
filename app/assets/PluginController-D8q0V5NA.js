import{_ as b,u as c,$ as I,D as g,a0 as E,Z as d,a1 as R,a2 as N,N as f}from"./index-B-iPa3RH.js";const p=new Map;function v(e){p.set(e,[]);const t=F(),n=L(e),o=T(e),i=A(e),r=M(e),s=U(e),a=G(e);return{pluginId:e,editor:t,events:n,ui:o,commands:i,themes:r,languages:s,storage:a}}function D(e){const t=p.get(e);if(t){for(const o of t)b(o.eventName,o.callback);p.delete(e)}c.getState().UnregisterAllByPluginId(e)}function F(){return{GetContent:()=>{const e=d();return e?e.getValue():""},SetContent:e=>{const t=d();t&&t.setValue(e)},InsertText:e=>{const t=d();if(t){const n=t.getPosition();n&&t.executeEdits("plugin",[{range:{startLineNumber:n.lineNumber,startColumn:n.column,endLineNumber:n.lineNumber,endColumn:n.column},text:e}])}},GetLanguage:()=>{const e=d();if(e){const t=e.getModel();if(t)return t.getLanguageId()}return"plaintext"},GetSelection:()=>{const e=d();if(e){const t=e.getSelection(),n=e.getModel();if(t&&n&&!t.isEmpty())return n.getValueInRange(t)}return""},SetSelection:(e,t,n,o)=>{const i=d();i&&i.setSelection({startLineNumber:e,startColumn:t,endLineNumber:n,endColumn:o})}}}function L(e){return{Subscribe:(t,n)=>{E(t,n);const o=p.get(e);o&&o.push({eventName:t,callback:n})},Dispatch:(t,n)=>{g(t,n)}}}function T(e){return{RegisterSidebarPanel:(t,n)=>{c.getState().RegisterPluginSidebarPanel({id:t,label:t,icon:"puzzle",pluginId:e,component:n})},RegisterStatusBarItem:(t,n)=>{c.getState().RegisterPluginStatusBarItem({id:t,position:"right",priority:50,pluginId:e,component:n})},RegisterMenuItem:(t,n)=>{c.getState().RegisterPluginMenuItem({menu:t,label:n.label,action:n.action,pluginId:e})},RegisterSettingsSection:(t,n)=>{c.getState().RegisterPluginSettingsSection({id:t,label:t,pluginId:e,component:n})},ShowNotification:(t,n)=>{},ShowDialog:t=>{c.getState().SetPluginDialogComponent(t)}}}function A(e){return{Register:(t,n)=>{c.getState().RegisterPluginCommand({id:t,handler:n,pluginId:e})},Execute:t=>{const o=c.getState().pluginCommands.find(i=>i.id===t);if(o)try{o.handler()}catch{}}}}function M(e){return{Register:(t,n)=>{c.getState().RegisterPluginTheme({id:`${e}.${t}`,name:t,colors:n,pluginId:e})}}}function U(e){return{Register:(t,n)=>{c.getState().RegisterPluginLanguage({id:t,config:n,pluginId:e})}}}function G(e){const t=`${I}${e}:`;return{Get:n=>{try{const o=localStorage.getItem(`${t}${n}`);return o===null?void 0:JSON.parse(o)}catch{return}},Set:(n,o)=>{try{localStorage.setItem(`${t}${n}`,JSON.stringify(o))}catch{}}}}function H(e){if(e===null||typeof e!="object")return!1;const t=e;if(typeof t.id!="string"||t.id.length===0||typeof t.name!="string"||t.name.length===0||typeof t.version!="string"||t.version.length===0||typeof t.description!="string"||typeof t.author!="string"||typeof t.main!="string"||t.main.length===0)return!1;if(t.engines&&typeof t.engines=="object"){const n=t.engines;if(typeof n.notemac=="string"){const o=n.notemac;if(!O(o,N))return!1}}return!0}function O(e,t){const n=e.trim();if(n.startsWith(">=")){const o=n.slice(2).trim();return w(t,o)>=0}if(n.startsWith("^")){const o=n.slice(1).trim(),i=o.split(".").map(Number);return t.split(".").map(Number)[0]===i[0]&&w(t,o)>=0}return w(t,n)>=0}function w(e,t){const n=e.split(".").map(Number),o=t.split(".").map(Number),i=Math.max(n.length,o.length);for(let r=0;r<i;r++){const s=n[r]||0,a=o[r]||0;if(s>a)return 1;if(s<a)return-1}return 0}async function $(e){const t=[];try{for await(const n of e.values())if(n.kind==="directory")try{const s=await(await(await n.getFileHandle(R)).getFile()).text(),a=JSON.parse(s);H(a)&&t.push({path:n.name,manifest:a})}catch{}}catch{}return t}async function j(e){const t=new Blob([e],{type:"application/javascript"}),n=URL.createObjectURL(t);try{const o=await import(n);if(typeof o.activate!="function")throw new Error("Plugin module must export an activate function");return{activate:o.activate,deactivate:typeof o.deactivate=="function"?o.deactivate:void 0}}finally{URL.revokeObjectURL(n)}}async function P(e,t){const i=await(await(await e.getFileHandle(t)).getFile()).text();return j(i)}async function k(e){try{const t=await fetch(`${e}/plugins`);if(!t.ok)throw new Error(`Registry fetch failed: ${t.status}`);const n=await t.json();return Array.isArray(n)?n.filter(B):[]}catch{return[]}}function B(e){if(e===null||typeof e!="object")return!1;const t=e;return typeof t.id=="string"&&0<t.id.length&&typeof t.name=="string"&&0<t.name.length&&typeof t.description=="string"&&typeof t.author=="string"&&typeof t.version=="string"&&typeof t.downloadUrl=="string"}function it(e,t){if(e.trim().length===0)return t;const n=e.toLowerCase();return t.filter(o=>o.name.toLowerCase().includes(n)||o.description.toLowerCase().includes(n)||o.author.toLowerCase().includes(n))}async function rt(e,t){try{const n={id:e.id,name:e.name,version:e.version,description:e.description,author:e.author,main:"index.js"};let o="";if(e.bundledCode)o=e.bundledCode;else{const a=await fetch(e.downloadUrl);if(!a.ok)throw new Error(`Download failed: ${a.status}`);if((a.headers.get("content-type")||"").includes("application/json")){const u=await a.json(),h=u.manifest||u;o=u.code||"",h.main&&(n.main=h.main),h.contributes&&(n.contributes=h.contributes)}else o=await a.text()}const i=await t.getDirectoryHandle(e.id,{create:!0}),s=await(await i.getFileHandle("manifest.json",{create:!0})).createWritable();if(await s.write(JSON.stringify(n,null,2)),await s.close(),o){const a=n.main||"index.js",u=await(await i.getFileHandle(a,{create:!0})).createWritable();await u.write(o),await u.close()}return n}catch{return null}}async function st(e,t){try{return await t.removeEntry(e,{recursive:!0}),!0}catch{return!1}}function S(){return[{id:"word-counter",name:"Word Counter",description:"Shows word, character, and line count in the status bar.",author:"Notemac Community",version:"1.0.0",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/word-counter/download",stars:127,downloads:4521,bundledCode:_()},{id:"color-picker",name:"Color Picker",description:"Inline color picker for CSS and design files.",author:"Notemac Community",version:"1.2.0",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/color-picker/download",stars:89,downloads:3210,bundledCode:V()},{id:"markdown-preview",name:"Markdown Preview",description:"Live preview panel for Markdown files.",author:"Notemac Community",version:"2.0.1",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/markdown-preview/download",stars:256,downloads:8901,bundledCode:W()},{id:"todo-highlight",name:"TODO Highlight",description:"Highlights TODO, FIXME, and HACK comments in code.",author:"Notemac Community",version:"1.1.0",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/todo-highlight/download",stars:198,downloads:6745,bundledCode:X()},{id:"file-icons",name:"File Icons",description:"Rich file icons for the explorer and tab bar.",author:"Notemac Community",version:"1.0.2",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/file-icons/download",stars:312,downloads:12040,bundledCode:z()}]}function _(){return`
export function activate(ctx) {
    const update = () => {
        const text = ctx.editor.getText() || '';
        const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
        const chars = text.length;
        const lines = text.split('\\n').length;
        ctx.ui.setStatusBarText('Words: ' + words + ' | Chars: ' + chars + ' | Lines: ' + lines);
    };
    ctx.events.on('editor:contentChanged', update);
    ctx.events.on('editor:tabChanged', update);
    update();
    ctx.commands.register('wordCounter.showCount', update);
}
export function deactivate() {}
`}function V(){return`
export function activate(ctx) {
    ctx.commands.register('colorPicker.insert', () => {
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        ctx.editor.insertText(color);
    });
    ctx.ui.setStatusBarText('Color Picker ready');
}
export function deactivate() {}
`}function W(){return`
export function activate(ctx) {
    ctx.commands.register('markdownPreview.toggle', () => {
        const text = ctx.editor.getText() || '';
        const html = text
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
            .replace(/\`(.+?)\`/g, '<code>$1</code>')
            .replace(/\\n/g, '<br>');
        ctx.storage.set('lastPreview', html);
    });
    ctx.ui.setStatusBarText('MD Preview ready');
}
export function deactivate() {}
`}function X(){return`
let decorations = [];
export function activate(ctx) {
    const highlight = () => {
        const editor = ctx.editor.getMonacoEditor();
        if (!editor) return;
        const model = editor.getModel();
        if (!model) return;
        const matches = [];
        const text = model.getValue();
        const regex = /\\b(TODO|FIXME|HACK|XXX|NOTE|BUG)\\b/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            const pos = model.getPositionAt(match.index);
            const endPos = model.getPositionAt(match.index + match[0].length);
            matches.push({
                range: { startLineNumber: pos.lineNumber, startColumn: pos.column, endLineNumber: endPos.lineNumber, endColumn: endPos.column },
                options: { inlineClassName: 'todo-highlight-decoration', hoverMessage: { value: match[0] + ' comment' } }
            });
        }
        decorations = editor.deltaDecorations(decorations, matches);
    };
    ctx.events.on('editor:contentChanged', highlight);
    ctx.events.on('editor:tabChanged', highlight);
    highlight();
    ctx.ui.setStatusBarText('TODO Highlight active');
}
export function deactivate() { decorations = []; }
`}function z(){return`
export function activate(ctx) {
    const iconMap = {
        js: '\\u{1F7E8}', ts: '\\u{1F535}', jsx: '\\u{269B}', tsx: '\\u{269B}',
        html: '\\u{1F7E0}', css: '\\u{1F7E3}', json: '\\u{1F4CB}', md: '\\u{1F4DD}',
        py: '\\u{1F40D}', rs: '\\u{2699}', go: '\\u{1F439}', java: '\\u{2615}',
        sh: '\\u{1F4BB}', yml: '\\u{2699}', yaml: '\\u{2699}', toml: '\\u{2699}',
        txt: '\\u{1F4C4}', svg: '\\u{1F3A8}', png: '\\u{1F5BC}', jpg: '\\u{1F5BC}',
    };
    ctx.commands.register('fileIcons.getIcon', () => {
        const fileName = ctx.editor.getFileName() || '';
        const ext = fileName.split('.').pop() || '';
        return iconMap[ext] || '\\u{1F4C4}';
    });
    ctx.ui.setStatusBarText('File Icons active');
}
export function deactivate() {}
`}let l=null;async function J(){const e=c.getState();if(e.settings.pluginsEnabled){try{if(l){const t=await $(l),n=[];for(const{path:o,manifest:i}of t){const r={id:i.id,manifest:i,status:"inactive",context:null,module:null};try{const s=await l.getDirectoryHandle(o),a=await P(s,i.main);r.module=a;const m=v(i.id);r.context=m,await a.activate(m),r.status="active",C(i),g(f.PLUGIN_ACTIVATED,{pluginId:i.id})}catch(s){r.status="error",r.error=s instanceof Error?s.message:String(s),g(f.PLUGIN_ERROR,{pluginId:i.id,error:r.error})}n.push(r)}e.SetPluginInstances(n)}}catch{}await nt()}}function q(e){l=e}function K(){return l}async function y(e){const t=c.getState(),n=[...t.pluginInstances],o=n.findIndex(r=>r.id===e);if(o===-1)return;const i={...n[o]};if(i.status!=="active"){try{if(!i.module)throw new Error("Plugin module not loaded");const r=v(e);i.context=r,await i.module.activate(r),i.status="active",i.error=void 0,C(i.manifest),g(f.PLUGIN_ACTIVATED,{pluginId:e})}catch(r){i.status="error",i.error=r instanceof Error?r.message:String(r),g(f.PLUGIN_ERROR,{pluginId:e,error:i.error})}n[o]=i,t.SetPluginInstances(n)}}async function x(e){var r;const t=c.getState(),n=[...t.pluginInstances],o=n.findIndex(s=>s.id===e);if(o===-1)return;const i={...n[o]};try{(r=i.module)!=null&&r.deactivate&&await i.module.deactivate()}catch{}D(e),i.status="inactive",i.context=null,i.error=void 0,n[o]=i,t.SetPluginInstances(n),g(f.PLUGIN_DEACTIVATED,{pluginId:e})}async function Q(e){await x(e);const t=c.getState(),n=[...t.pluginInstances],o=n.findIndex(r=>r.id===e);if(o===-1||!l)return;const i={...n[o]};try{const r=await l.getDirectoryHandle(i.manifest.id),s=await P(r,i.manifest.main);i.module=s,n[o]=i,t.SetPluginInstances(n),await y(e)}catch(r){i.status="error",i.error=r instanceof Error?r.message:String(r),n[o]=i,t.SetPluginInstances(n)}}async function Z(e){await y(e)}async function Y(e){await x(e)}function tt(e){const n=c.getState().pluginInstances.find(o=>o.id===e);return(n==null?void 0:n.status)||"inactive"}function et(e){const n=c.getState().pluginCommands.find(o=>o.id===e);if(n)try{n.handler()}catch{}}function C(e){const t=c.getState(),n=e.contributes;if(n&&n.shortcuts)for(const o of n.shortcuts)t.RegisterPluginShortcut({shortcut:o.shortcut,action:o.action,category:o.category,pluginId:e.id})}async function nt(){const e=c.getState();e.SetPluginRegistryLoading(!0);try{const t=e.settings.pluginRegistryUrl,n=await k(t);0<n.length?e.SetPluginRegistryEntries(n):e.SetPluginRegistryEntries(S())}catch{e.SetPluginRegistryEntries(S())}finally{e.SetPluginRegistryLoading(!1)}}const at=Object.freeze(Object.defineProperty({__proto__:null,ActivatePlugin:y,DeactivatePlugin:x,DisablePlugin:Y,EnablePlugin:Z,ExecutePluginCommand:et,GetPluginDirectoryHandle:K,GetPluginStatus:tt,InitializePluginSystem:J,ReloadPlugin:Q,SetPluginDirectoryHandle:q},Symbol.toStringTag,{value:"Module"}));export{y as A,x as D,K as G,rt as I,at as P,Q as R,it as S,st as U,q as a,Y as b};
