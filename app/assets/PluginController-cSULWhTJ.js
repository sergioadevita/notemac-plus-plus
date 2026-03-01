import{_ as k,u as c,$ as C,D as m,a0 as L,Z as d,a1 as R,a2 as N,N as g}from"./index-D1noeabi.js";const p=new Map;function y(e){p.set(e,[]);const t=E(),n=A(e),o=G(e),i=T(e),r=D(e),s=H(e),a=U(e);return{pluginId:e,editor:t,events:n,ui:o,commands:i,themes:r,languages:s,storage:a}}function I(e){const t=p.get(e);if(t){for(const o of t)k(o.eventName,o.callback);p.delete(e)}c.getState().UnregisterAllByPluginId(e)}function E(){return{GetContent:()=>{const e=d();return e?e.getValue():""},SetContent:e=>{const t=d();t&&t.setValue(e)},InsertText:e=>{const t=d();if(t){const n=t.getPosition();n&&t.executeEdits("plugin",[{range:{startLineNumber:n.lineNumber,startColumn:n.column,endLineNumber:n.lineNumber,endColumn:n.column},text:e}])}},GetLanguage:()=>{const e=d();if(e){const t=e.getModel();if(t)return t.getLanguageId()}return"plaintext"},GetSelection:()=>{const e=d();if(e){const t=e.getSelection(),n=e.getModel();if(t&&n&&!t.isEmpty())return n.getValueInRange(t)}return""},SetSelection:(e,t,n,o)=>{const i=d();i&&i.setSelection({startLineNumber:e,startColumn:t,endLineNumber:n,endColumn:o})}}}function A(e){return{Subscribe:(t,n)=>{L(t,n);const o=p.get(e);o&&o.push({eventName:t,callback:n})},Dispatch:(t,n)=>{m(t,n)}}}function G(e){return{RegisterSidebarPanel:(t,n)=>{c.getState().RegisterPluginSidebarPanel({id:t,label:t,icon:"puzzle",pluginId:e,component:n})},RegisterStatusBarItem:(t,n)=>{c.getState().RegisterPluginStatusBarItem({id:t,position:"right",priority:50,pluginId:e,component:n})},RegisterMenuItem:(t,n)=>{c.getState().RegisterPluginMenuItem({menu:t,label:n.label,action:n.action,pluginId:e})},RegisterSettingsSection:(t,n)=>{c.getState().RegisterPluginSettingsSection({id:t,label:t,pluginId:e,component:n})},ShowNotification:(t,n)=>{},ShowDialog:t=>{c.getState().SetPluginDialogComponent(t)}}}function T(e){return{Register:(t,n)=>{c.getState().RegisterPluginCommand({id:t,handler:n,pluginId:e})},Execute:t=>{const o=c.getState().pluginCommands.find(i=>i.id===t);if(o)try{o.handler()}catch{}}}}function D(e){return{Register:(t,n)=>{c.getState().RegisterPluginTheme({id:`${e}.${t}`,name:t,colors:n,pluginId:e})}}}function H(e){return{Register:(t,n)=>{c.getState().RegisterPluginLanguage({id:t,config:n,pluginId:e})}}}function U(e){const t=`${C}${e}:`;return{Get:n=>{try{const o=localStorage.getItem(`${t}${n}`);return o===null?void 0:JSON.parse(o)}catch{return}},Set:(n,o)=>{try{localStorage.setItem(`${t}${n}`,JSON.stringify(o))}catch{}}}}function M(e){if(e===null||typeof e!="object")return!1;const t=e;if(typeof t.id!="string"||t.id.length===0||typeof t.name!="string"||t.name.length===0||typeof t.version!="string"||t.version.length===0||typeof t.description!="string"||typeof t.author!="string"||typeof t.main!="string"||t.main.length===0)return!1;if(t.engines&&typeof t.engines=="object"){const n=t.engines;if(typeof n.notemac=="string"){const o=n.notemac;if(!O(o,N))return!1}}return!0}function O(e,t){const n=e.trim();if(n.startsWith(">=")){const o=n.slice(2).trim();return b(t,o)>=0}if(n.startsWith("^")){const o=n.slice(1).trim(),i=o.split(".").map(Number);return t.split(".").map(Number)[0]===i[0]&&b(t,o)>=0}return b(t,n)>=0}function b(e,t){const n=e.split(".").map(Number),o=t.split(".").map(Number),i=Math.max(n.length,o.length);for(let r=0;r<i;r++){const s=n[r]||0,a=o[r]||0;if(s>a)return 1;if(s<a)return-1}return 0}async function j(e){const t=[];try{for await(const n of e.values())if(n.kind==="directory")try{const s=await(await(await n.getFileHandle(R)).getFile()).text(),a=JSON.parse(s);M(a)&&t.push({path:n.name,manifest:a})}catch{}}catch{}return t}async function $(e){const t=new Blob([e],{type:"application/javascript"}),n=URL.createObjectURL(t);try{const o=await import(n);if(typeof o.activate!="function")throw new Error("Plugin module must export an activate function");return{activate:o.activate,deactivate:typeof o.deactivate=="function"?o.deactivate:void 0}}finally{URL.revokeObjectURL(n)}}async function v(e,t){const i=await(await(await e.getFileHandle(t)).getFile()).text();return $(i)}async function F(e){try{const t=await fetch(`${e}/plugins`);if(!t.ok)throw new Error(`Registry fetch failed: ${t.status}`);const n=await t.json();return Array.isArray(n)?n.filter(_):[]}catch{return[]}}function _(e){if(e===null||typeof e!="object")return!1;const t=e;return typeof t.id=="string"&&0<t.id.length&&typeof t.name=="string"&&0<t.name.length&&typeof t.description=="string"&&typeof t.author=="string"&&typeof t.version=="string"&&typeof t.downloadUrl=="string"}function it(e,t){if(e.trim().length===0)return t;const n=e.toLowerCase();return t.filter(o=>o.name.toLowerCase().includes(n)||o.description.toLowerCase().includes(n)||o.author.toLowerCase().includes(n))}async function rt(e,t){try{const n={id:e.id,name:e.name,version:e.version,description:e.description,author:e.author,main:"index.js"};let o="";if(e.bundledCode)o=e.bundledCode;else{const a=await fetch(e.downloadUrl);if(!a.ok)throw new Error(`Download failed: ${a.status}`);if((a.headers.get("content-type")||"").includes("application/json")){const u=await a.json(),h=u.manifest||u;o=u.code||"",h.main&&(n.main=h.main),h.contributes&&(n.contributes=h.contributes)}else o=await a.text()}const i=await t.getDirectoryHandle(e.id,{create:!0}),s=await(await i.getFileHandle("manifest.json",{create:!0})).createWritable();if(await s.write(JSON.stringify(n,null,2)),await s.close(),o){const a=n.main||"index.js",u=await(await i.getFileHandle(a,{create:!0})).createWritable();await u.write(o),await u.close()}return n}catch{return null}}async function st(e,t){try{return await t.removeEntry(e,{recursive:!0}),!0}catch{return!1}}function w(){return[{id:"lorem-ipsum",name:"Lorem Ipsum Generator",description:"Insert placeholder text at the cursor. Supports paragraphs and short sentences.",author:"Notemac Community",version:"1.0.0",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/lorem-ipsum/download",stars:145,downloads:5230,bundledCode:q()},{id:"sort-lines",name:"Sort Lines",description:"Sort selected lines alphabetically, in reverse, or by line length.",author:"Notemac Community",version:"1.1.0",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/sort-lines/download",stars:203,downloads:7840,bundledCode:V()},{id:"markdown-preview",name:"Markdown Preview",description:"Convert the current Markdown document to HTML and store the result for preview.",author:"Notemac Community",version:"2.0.1",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/markdown-preview/download",stars:256,downloads:8901,bundledCode:B()},{id:"todo-highlight",name:"TODO Highlight",description:"Highlights TODO, FIXME, HACK, XXX, NOTE, and BUG comments in code.",author:"Notemac Community",version:"1.1.0",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/todo-highlight/download",stars:198,downloads:6745,bundledCode:X()},{id:"bookmarks",name:"Bookmarks",description:"Toggle line bookmarks and jump between them with keyboard shortcuts.",author:"Notemac Community",version:"1.0.0",downloadUrl:"https://registry.notemac.dev/api/v1/plugins/bookmarks/download",stars:312,downloads:11200,bundledCode:W()}]}function q(){return`
const PARAGRAPHS = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
    'Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus.',
    'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.',
];

export function activate(ctx) {
    ctx.commands.Register('loremIpsum.insertParagraph', () => {
        const idx = Math.floor(Math.random() * PARAGRAPHS.length);
        ctx.editor.InsertText(PARAGRAPHS[idx] + '\\n\\n');
    });
    ctx.commands.Register('loremIpsum.insertThree', () => {
        const shuffled = [...PARAGRAPHS].sort(() => Math.random() - 0.5);
        ctx.editor.InsertText(shuffled.slice(0, 3).join('\\n\\n') + '\\n\\n');
    });
    ctx.ui.ShowNotification('Lorem Ipsum Generator ready');
}
export function deactivate() {}
`}function V(){return`
export function activate(ctx) {
    ctx.commands.Register('sortLines.ascending', () => {
        const sel = ctx.editor.GetSelection();
        if (!sel) { ctx.ui.ShowNotification('Select lines to sort first'); return; }
        const sorted = sel.split('\\n').sort((a, b) => a.localeCompare(b)).join('\\n');
        ctx.editor.InsertText(sorted);
    });
    ctx.commands.Register('sortLines.descending', () => {
        const sel = ctx.editor.GetSelection();
        if (!sel) { ctx.ui.ShowNotification('Select lines to sort first'); return; }
        const sorted = sel.split('\\n').sort((a, b) => b.localeCompare(a)).join('\\n');
        ctx.editor.InsertText(sorted);
    });
    ctx.commands.Register('sortLines.byLength', () => {
        const sel = ctx.editor.GetSelection();
        if (!sel) { ctx.ui.ShowNotification('Select lines to sort first'); return; }
        const sorted = sel.split('\\n').sort((a, b) => a.length - b.length).join('\\n');
        ctx.editor.InsertText(sorted);
    });
    ctx.commands.Register('sortLines.removeDuplicates', () => {
        const sel = ctx.editor.GetSelection();
        if (!sel) { ctx.ui.ShowNotification('Select lines first'); return; }
        const unique = [...new Set(sel.split('\\n'))].join('\\n');
        ctx.editor.InsertText(unique);
    });
    ctx.ui.ShowNotification('Sort Lines ready — use Command Palette');
}
export function deactivate() {}
`}function B(){return`
export function activate(ctx) {
    ctx.commands.Register('markdownPreview.convert', () => {
        const text = ctx.editor.GetContent() || '';
        const html = text
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
            .replace(/\`(.+?)\`/g, '<code>$1</code>')
            .replace(/\\n/g, '<br>');
        ctx.storage.Set('lastPreview', html);
        ctx.ui.ShowNotification('Markdown converted — ' + html.length + ' chars of HTML');
    });
    ctx.ui.ShowNotification('Markdown Preview ready');
}
export function deactivate() {}
`}function X(){return`
let decorations = [];
export function activate(ctx) {
    const highlight = () => {
        const content = ctx.editor.GetContent() || '';
        if (!content) return;
        const lines = content.split('\\n');
        const matches = [];
        const keywords = /\\b(TODO|FIXME|HACK|XXX|NOTE|BUG)\\b/g;
        for (let i = 0; i < lines.length; i++) {
            let match;
            while ((match = keywords.exec(lines[i])) !== null) {
                matches.push({
                    range: {
                        startLineNumber: i + 1,
                        startColumn: match.index + 1,
                        endLineNumber: i + 1,
                        endColumn: match.index + match[0].length + 1
                    },
                    options: {
                        inlineClassName: 'todo-highlight-decoration',
                        hoverMessage: { value: match[0] + ' comment' }
                    }
                });
            }
            keywords.lastIndex = 0;
        }
        ctx.storage.Set('highlightCount', matches.length);
        ctx.ui.ShowNotification('Found ' + matches.length + ' TODO-style comments');
    };
    ctx.events.Subscribe('editor:contentChanged', highlight);
    ctx.events.Subscribe('editor:tabChanged', highlight);
    ctx.commands.Register('todoHighlight.scan', highlight);
    highlight();
}
export function deactivate() { decorations = []; }
`}function W(){return`
let bookmarkedLines = [];

export function activate(ctx) {
    ctx.commands.Register('bookmarks.toggle', () => {
        const content = ctx.editor.GetContent() || '';
        const sel = ctx.editor.GetSelection();
        if (!content) return;
        const beforeCursor = content.substring(0, content.indexOf(sel) || 0);
        const currentLine = (beforeCursor.match(/\\n/g) || []).length + 1;
        const idx = bookmarkedLines.indexOf(currentLine);
        if (-1 !== idx) {
            bookmarkedLines.splice(idx, 1);
            ctx.ui.ShowNotification('Bookmark removed from line ' + currentLine);
        } else {
            bookmarkedLines.push(currentLine);
            bookmarkedLines.sort((a, b) => a - b);
            ctx.ui.ShowNotification('Bookmark set on line ' + currentLine);
        }
        ctx.storage.Set('bookmarks', bookmarkedLines);
    });
    ctx.commands.Register('bookmarks.next', () => {
        if (0 === bookmarkedLines.length) {
            ctx.ui.ShowNotification('No bookmarks set');
            return;
        }
        ctx.ui.ShowNotification('Bookmarks on lines: ' + bookmarkedLines.join(', '));
    });
    ctx.commands.Register('bookmarks.clear', () => {
        bookmarkedLines = [];
        ctx.storage.Set('bookmarks', []);
        ctx.ui.ShowNotification('All bookmarks cleared');
    });

    const saved = ctx.storage.Get('bookmarks');
    if (saved && Array.isArray(saved)) {
        bookmarkedLines = saved;
    }
    ctx.ui.ShowNotification('Bookmarks ready — ' + bookmarkedLines.length + ' bookmarks loaded');
}
export function deactivate() { bookmarkedLines = []; }
`}let l=null;async function z(){const e=c.getState();if(e.settings.pluginsEnabled){try{if(l){const t=await j(l),n=[];for(const{path:o,manifest:i}of t){const r={id:i.id,manifest:i,status:"inactive",context:null,module:null};try{const s=await l.getDirectoryHandle(o),a=await v(s,i.main);r.module=a;const f=y(i.id);r.context=f,await a.activate(f),r.status="active",P(i),m(g.PLUGIN_ACTIVATED,{pluginId:i.id})}catch(s){r.status="error",r.error=s instanceof Error?s.message:String(s),m(g.PLUGIN_ERROR,{pluginId:i.id,error:r.error})}n.push(r)}e.SetPluginInstances(n)}}catch{}await nt()}}function J(e){l=e}function K(){return l}async function x(e){const t=c.getState(),n=[...t.pluginInstances],o=n.findIndex(r=>r.id===e);if(o===-1)return;const i={...n[o]};if(i.status!=="active"){try{if(!i.module)throw new Error("Plugin module not loaded");const r=y(e);i.context=r,await i.module.activate(r),i.status="active",i.error=void 0,P(i.manifest),m(g.PLUGIN_ACTIVATED,{pluginId:e})}catch(r){i.status="error",i.error=r instanceof Error?r.message:String(r),m(g.PLUGIN_ERROR,{pluginId:e,error:i.error})}n[o]=i,t.SetPluginInstances(n)}}async function S(e){var r;const t=c.getState(),n=[...t.pluginInstances],o=n.findIndex(s=>s.id===e);if(o===-1)return;const i={...n[o]};try{(r=i.module)!=null&&r.deactivate&&await i.module.deactivate()}catch{}I(e),i.status="inactive",i.context=null,i.error=void 0,n[o]=i,t.SetPluginInstances(n),m(g.PLUGIN_DEACTIVATED,{pluginId:e})}async function Q(e){await S(e);const t=c.getState(),n=[...t.pluginInstances],o=n.findIndex(r=>r.id===e);if(o===-1||!l)return;const i={...n[o]};try{const r=await l.getDirectoryHandle(i.manifest.id),s=await v(r,i.manifest.main);i.module=s,n[o]=i,t.SetPluginInstances(n),await x(e)}catch(r){i.status="error",i.error=r instanceof Error?r.message:String(r),n[o]=i,t.SetPluginInstances(n)}}async function Z(e){await x(e)}async function Y(e){await S(e)}function tt(e){const n=c.getState().pluginInstances.find(o=>o.id===e);return(n==null?void 0:n.status)||"inactive"}function et(e){const n=c.getState().pluginCommands.find(o=>o.id===e);if(n)try{n.handler()}catch{}}function P(e){const t=c.getState(),n=e.contributes;if(n&&n.shortcuts)for(const o of n.shortcuts)t.RegisterPluginShortcut({shortcut:o.shortcut,action:o.action,category:o.category,pluginId:e.id})}async function nt(){const e=c.getState();e.SetPluginRegistryLoading(!0);try{const t=e.settings.pluginRegistryUrl,n=await F(t);0<n.length?e.SetPluginRegistryEntries(n):e.SetPluginRegistryEntries(w())}catch{e.SetPluginRegistryEntries(w())}finally{e.SetPluginRegistryLoading(!1)}}const at=Object.freeze(Object.defineProperty({__proto__:null,ActivatePlugin:x,DeactivatePlugin:S,DisablePlugin:Y,EnablePlugin:Z,ExecutePluginCommand:et,GetPluginDirectoryHandle:K,GetPluginStatus:tt,InitializePluginSystem:z,ReloadPlugin:Q,SetPluginDirectoryHandle:J},Symbol.toStringTag,{value:"Module"}));export{x as A,S as D,K as G,rt as I,at as P,Q as R,it as S,st as U,J as a,Y as b};
