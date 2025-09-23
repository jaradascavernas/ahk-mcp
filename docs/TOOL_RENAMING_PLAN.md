# Tool Chain Renaming Plan

## 🎯 **Proposed File & Tool Renaming Strategy**

### **PHASE 1: File Operations Chain** (`ahk-file-*`)

| Current File Name | Current Tool Name | → | New File Name | New Tool Name | Purpose |
|------------------|-------------------|---|---------------|---------------|---------|
| `ahk-file.ts` | `ahk_file` | → | `ahk-file-active.ts` | `ahk_file_active` | Set/get active file context |
| `ahk-auto-file.ts` | `ahk_auto_file` | → | `ahk-file-detect.ts` | `ahk_file_detect` | Auto-detect files from text |
| `ahk-recent.ts` | `ahk_recent_scripts` | → | `ahk-file-recent.ts` | `ahk_file_recent` | Recent file history |
| `ahk-active-file.ts` | `ahk_active_file` | → | (REMOVE - duplicate) | (merge into ahk_file_active) | Duplicate functionality |
| (NEW) | - | → | `ahk-file-view.ts` | `ahk_file_view` | View files (already created) |
| `ahk-edit.ts` | `ahk_edit` | → | `ahk-file-edit.ts` | `ahk_file_edit` | Edit active file |
| `ahk-small-edit.ts` | `ahk_small_edit` | → | `ahk-file-edit-small.ts` | `ahk_file_edit_small` | Small targeted edits |
| `ahk-diff-edit.ts` | `ahk_diff_edit` | → | `ahk-file-edit-diff.ts` | `ahk_file_edit_diff` | Diff-based editing |
| `ahk-file-editor.ts` | `ahk_file_editor` | → | `ahk-file-edit-advanced.ts` | `ahk_file_edit_advanced` | Advanced editing features |

**Chain Benefits**: All file operations start with `ahk-file-` making them easy to discover and understand.

---

### **PHASE 2: Analysis Chain** (`ahk-analyze-*`)

| Current File Name | Current Tool Name | → | New File Name | New Tool Name | Purpose |
|------------------|-------------------|---|---------------|---------------|---------|
| `ahk-analyze.ts` | `ahk_analyze` | → | `ahk-analyze-code.ts` | `ahk_analyze_code` | Code analysis & documentation |
| `ahk-diagnostics.ts` | `ahk_diagnostics` | → | `ahk-analyze-diagnostics.ts` | `ahk_analyze_diagnostics` | Error detection |
| `ahk-lsp.ts` | `ahk_lsp` | → | `ahk-analyze-lsp.ts` | `ahk_analyze_lsp` | LSP-style analysis & fixes |
| `ahk-summary.ts` | `ahk_summary` | → | `ahk-analyze-summary.ts` | `ahk_analyze_summary` | Project summaries |
| `ahk-vscode-problems.ts` | `ahk_vscode_problems` | → | `ahk-analyze-vscode.ts` | `ahk_analyze_vscode` | VS Code integration |
| `ahk-analyze-unified.ts` | `ahk_analyze_unified` | → | `ahk-analyze-complete.ts` | `ahk_analyze_complete` | Complete analysis pipeline |

**Chain Benefits**: All analysis tools grouped together, clear progression from basic to advanced.

---

### **PHASE 3: Execution Chain** (`ahk-run-*`)

| Current File Name | Current Tool Name | → | New File Name | New Tool Name | Purpose |
|------------------|-------------------|---|---------------|---------------|---------|
| `ahk-run.ts` | `ahk_run` | → | `ahk-run-script.ts` | `ahk_run_script` | Execute AutoHotkey scripts |
| `ahk-debug-agent.ts` | `ahk_debug_agent` | → | `ahk-run-debug.ts` | `ahk_run_debug` | Debug execution |
| `ahk-process-request.ts` | `ahk_process_request` | → | `ahk-run-process.ts` | `ahk_run_process` | Process management |

**Chain Benefits**: Clear execution workflow from running to debugging.

---

### **PHASE 4: Documentation Chain** (`ahk-docs-*`)

| Current File Name | Current Tool Name | → | New File Name | New Tool Name | Purpose |
|------------------|-------------------|---|---------------|---------------|---------|
| `ahk-doc-search.ts` | `ahk_doc_search` | → | `ahk-docs-search.ts` | `ahk_docs_search` | Search documentation |
| `ahk-prompts.ts` | `ahk_prompts` | → | `ahk-docs-prompts.ts` | `ahk_docs_prompts` | Prompt catalog |
| `ahk-context-injector.ts` | `ahk_context_injector` | → | `ahk-docs-context.ts` | `ahk_docs_context` | Context injection |
| `module-prompt-manager.ts` | `module_prompt_manager` | → | `ahk-docs-modules.ts` | `ahk_docs_modules` | Module management |
| `ahk-sampling-enhancer.ts` | `ahk_sampling_enhancer` | → | `ahk-docs-samples.ts` | `ahk_docs_samples` | Code samples |

**Chain Benefits**: All documentation and knowledge tools in one place.

---

### **PHASE 5: System Chain** (`ahk-system-*`)

| Current File Name | Current Tool Name | → | New File Name | New Tool Name | Purpose |
|------------------|-------------------|---|---------------|---------------|---------|
| `ahk-config.ts` | `ahk_config` | → | `ahk-system-config.ts` | `ahk_system_config` | Configuration management |
| `ahk-settings.ts` | `ahk_settings` | → | `ahk-system-settings.ts` | `ahk_system_settings` | MCP settings |
| `ahk-alpha.ts` | `ahk_alpha` | → | `ahk-system-alpha.ts` | `ahk_system_alpha` | Alpha/experimental features |

**Chain Benefits**: System-level tools clearly separated from user-facing tools.

---

## 🔄 **Migration Strategy**

### **Step 1: Backward Compatibility**
```typescript
// In server.ts, register both old and new names
'ahk_file': ahkFileActiveTool,      // Old name (deprecated)
'ahk_file_active': ahkFileActiveTool // New name
```

### **Step 2: Deprecation Warnings**
```typescript
if (toolName.startsWith('ahk_') && !toolName.includes('_')) {
  logger.warn(`Tool name '${toolName}' is deprecated. Use '${newName}' instead.`);
}
```

### **Step 3: Gradual Migration**
1. **Phase 1**: Implement file chain first (most used)
2. **Phase 2**: Analysis chain (second most used)
3. **Phase 3-5**: Other chains in parallel
4. **Final**: Remove old names after transition period

---

## ❓ **Questions for Approval**

1. **File chain naming**:
   - Should it be `ahk-file-edit-small` or `ahk-file-small-edit`?
   - Should `ahk-file-active` just be `ahk-file`?

2. **Analysis chain**:
   - Keep `ahk-analyze-` or use `ahk-analysis-`?
   - Should LSP tool be `ahk-analyze-lsp` or something more descriptive?

3. **Tool name format**:
   - Hyphens in files: `ahk-file-edit.ts`
   - Underscores in tools: `ahk_file_edit`
   - Is this consistent enough?

4. **Priority**:
   - Which chain should we implement first?
   - Should we do all at once or gradually?

5. **Special cases**:
   - What about `ahk-active-file.ts` which duplicates `ahk-file.ts`?
   - Should we merge them or keep both?

---

## 📊 **Impact Analysis**

### **Files to Change**
- **24 tool files** to rename
- **1 server file** to update all imports and registrations
- **Multiple test files** to update tool names
- **Documentation** to update with new names

### **Benefits**
- ✅ **Discoverability**: 5 clear chains instead of 24 random tools
- ✅ **Predictability**: Users can guess tool names
- ✅ **Scalability**: Easy to add new tools to chains
- ✅ **Mental model**: Clear tool organization

### **Risks**
- ⚠️ **Breaking change** for existing users
- ⚠️ **Documentation** needs updating
- ⚠️ **Testing** required for all renamed tools

---

## 🎯 **Recommendation**

**Start with Phase 1 (File Chain)** as proof of concept:
1. Most commonly used tools
2. Clearest naming pattern
3. Already have `ahk-file-view` working
4. Easiest to test and validate

Then roll out other phases based on success.

**What do you think of this plan?** Any naming changes or concerns?