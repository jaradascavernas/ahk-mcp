import { z } from 'zod';
import fs from 'fs/promises';
import logger from '../logger.js';
import { activeFile } from '../core/active-file.js';
import { checkToolAvailability } from '../core/tool-settings.js';
export const AhkDiffEditArgsSchema = z.object({
    diff: z.string().describe('Unified diff format patch to apply'),
    filePath: z.string().optional().describe('File path to edit (defaults to activeFilePath)'),
    dryRun: z.boolean().optional().default(false).describe('Preview changes without applying'),
    createBackup: z.boolean().optional().default(true).describe('Create backup before editing')
});
export const ahkDiffEditToolDefinition = {
    name: 'ahk_diff_edit',
    description: 'Apply unified diff patches to edit AutoHotkey files (similar to Claude filesystem MCP)',
    inputSchema: {
        type: 'object',
        properties: {
            diff: {
                type: 'string',
                description: 'Unified diff format patch to apply'
            },
            filePath: {
                type: 'string',
                description: 'File path to edit (defaults to activeFilePath)'
            },
            dryRun: {
                type: 'boolean',
                default: false,
                description: 'Preview changes without applying'
            },
            createBackup: {
                type: 'boolean',
                default: true,
                description: 'Create backup before editing'
            }
        },
        required: ['diff']
    }
};
export class AhkDiffEditTool {
    /**
     * Parse unified diff format
     */
    parseDiff(diff) {
        const lines = diff.split('\n');
        const result = {
            oldFile: '',
            newFile: '',
            hunks: []
        };
        let currentHunk = null;
        let inHeader = true;
        for (const line of lines) {
            // Parse file headers
            if (line.startsWith('--- ')) {
                result.oldFile = line.substring(4).trim();
                inHeader = true;
                continue;
            }
            if (line.startsWith('+++ ')) {
                result.newFile = line.substring(4).trim();
                inHeader = false;
                continue;
            }
            // Parse hunk headers
            const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
            if (hunkMatch) {
                if (currentHunk) {
                    result.hunks.push(currentHunk);
                }
                currentHunk = {
                    oldStart: parseInt(hunkMatch[1], 10),
                    oldLines: parseInt(hunkMatch[2] || '1', 10),
                    newStart: parseInt(hunkMatch[3], 10),
                    newLines: parseInt(hunkMatch[4] || '1', 10),
                    lines: []
                };
                continue;
            }
            // Parse hunk content
            if (currentHunk && !inHeader) {
                if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
                    currentHunk.lines.push(line);
                }
                else if (line === '' && currentHunk.lines.length > 0) {
                    // Empty line in diff
                    currentHunk.lines.push(line);
                }
            }
        }
        if (currentHunk) {
            result.hunks.push(currentHunk);
        }
        return result;
    }
    /**
     * Apply a parsed diff to file content
     */
    applyDiff(content, diff) {
        const lines = content.split('\n');
        const result = [];
        let lineIndex = 0;
        for (const hunk of diff.hunks) {
            // Copy unchanged lines before this hunk
            while (lineIndex < hunk.oldStart - 1) {
                if (lineIndex < lines.length) {
                    result.push(lines[lineIndex]);
                }
                lineIndex++;
            }
            // Apply the hunk
            const hunkOldLines = [];
            const hunkNewLines = [];
            for (const hunkLine of hunk.lines) {
                if (hunkLine.startsWith('-')) {
                    hunkOldLines.push(hunkLine.substring(1));
                }
                else if (hunkLine.startsWith('+')) {
                    hunkNewLines.push(hunkLine.substring(1));
                }
                else if (hunkLine.startsWith(' ')) {
                    hunkOldLines.push(hunkLine.substring(1));
                    hunkNewLines.push(hunkLine.substring(1));
                }
            }
            // Verify the old content matches
            let matches = true;
            for (let i = 0; i < hunkOldLines.length; i++) {
                if (lineIndex + i >= lines.length || lines[lineIndex + i] !== hunkOldLines[i]) {
                    matches = false;
                    logger.warn(`Hunk mismatch at line ${lineIndex + i + 1}`);
                    logger.warn(`Expected: "${hunkOldLines[i]}"`);
                    logger.warn(`Found: "${lines[lineIndex + i] || '(EOF)'}"`);
                    break;
                }
            }
            if (!matches) {
                throw new Error(`Diff cannot be applied: content mismatch at line ${lineIndex + 1}`);
            }
            // Add the new lines
            result.push(...hunkNewLines);
            lineIndex += hunkOldLines.length;
        }
        // Copy remaining lines
        while (lineIndex < lines.length) {
            result.push(lines[lineIndex]);
            lineIndex++;
        }
        return result.join('\n');
    }
    /**
     * Create a simple diff for display
     */
    createSimpleDiff(original, modified) {
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');
        let diff = '';
        const maxLines = Math.max(originalLines.length, modifiedLines.length);
        for (let i = 0; i < maxLines; i++) {
            const origLine = originalLines[i];
            const modLine = modifiedLines[i];
            if (origLine === modLine) {
                // Context line
                if (i < originalLines.length) {
                    diff += `  ${origLine}\n`;
                }
            }
            else if (origLine !== undefined && modLine !== undefined) {
                // Changed line
                diff += `- ${origLine}\n`;
                diff += `+ ${modLine}\n`;
            }
            else if (origLine !== undefined) {
                // Deleted line
                diff += `- ${origLine}\n`;
            }
            else if (modLine !== undefined) {
                // Added line
                diff += `+ ${modLine}\n`;
            }
        }
        return diff;
    }
    /**
     * Execute the diff edit tool
     */
    async execute(args) {
        try {
            // Check if tool is enabled
            const availability = checkToolAvailability('ahk_diff_edit');
            if (!availability.enabled) {
                return {
                    content: [{ type: 'text', text: availability.message || 'Tool is disabled' }]
                };
            }
            const { diff, filePath, dryRun, createBackup } = AhkDiffEditArgsSchema.parse(args);
            // Get the target file
            const targetFile = filePath || activeFile.getActiveFile();
            if (!targetFile) {
                throw new Error('No file specified and no active file set. Use ahk_file to set an active file first.');
            }
            // Ensure it's an .ahk file
            if (!targetFile.toLowerCase().endsWith('.ahk')) {
                throw new Error('Can only edit .ahk files');
            }
            // Read the current content
            let currentContent;
            try {
                currentContent = await fs.readFile(targetFile, 'utf-8');
            }
            catch (error) {
                throw new Error(`Failed to read file: ${targetFile}`);
            }
            // Parse the diff
            const parsedDiff = this.parseDiff(diff);
            // Apply the diff
            let newContent;
            try {
                newContent = this.applyDiff(currentContent, parsedDiff);
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Failed to apply diff: ${error}\n\nMake sure the diff matches the current file content.`
                        }],
                    isError: true
                };
            }
            // Generate response
            let response = `📝 **Diff Edit for:** ${targetFile}\n\n`;
            if (dryRun) {
                response += '**🔍 DRY RUN - Changes NOT applied**\n\n';
                response += '**Preview of changes:**\n```diff\n';
                response += this.createSimpleDiff(currentContent, newContent);
                response += '```\n\n';
                const linesChanged = Math.abs(newContent.split('\n').length - currentContent.split('\n').length);
                response += `**Summary:** ${parsedDiff.hunks.length} hunk(s), ~${linesChanged} line(s) changed`;
            }
            else {
                // Create backup if requested
                if (createBackup) {
                    const backupPath = targetFile + '.bak';
                    await fs.writeFile(backupPath, currentContent, 'utf-8');
                    response += `💾 Backup created: ${backupPath}\n`;
                }
                // Apply the changes
                await fs.writeFile(targetFile, newContent, 'utf-8');
                response += '✅ **Changes applied successfully!**\n\n';
                response += `**Summary:**\n`;
                response += `- Hunks applied: ${parsedDiff.hunks.length}\n`;
                response += `- Lines before: ${currentContent.split('\n').length}\n`;
                response += `- Lines after: ${newContent.split('\n').length}\n`;
                // Update active file to ensure it's current
                activeFile.setActiveFile(targetFile);
            }
            return {
                content: [{
                        type: 'text',
                        text: response
                    }]
            };
        }
        catch (error) {
            logger.error('Error in ahk_diff_edit tool:', error);
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`
                    }],
                isError: true
            };
        }
    }
}
/**
 * Helper function to create a unified diff from old and new content
 * This can be used by other tools to generate diffs
 */
export function createUnifiedDiff(oldContent, newContent, oldFile = 'original', newFile = 'modified') {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    let diff = `--- ${oldFile}\n`;
    diff += `+++ ${newFile}\n`;
    // Simple diff algorithm (for demonstration)
    // In production, you'd want to use a proper diff algorithm
    let i = 0;
    let j = 0;
    while (i < oldLines.length || j < newLines.length) {
        if (i >= oldLines.length) {
            // Remaining new lines
            diff += `@@ -${oldLines.length},0 +${j + 1},${newLines.length - j} @@\n`;
            while (j < newLines.length) {
                diff += `+${newLines[j]}\n`;
                j++;
            }
            break;
        }
        else if (j >= newLines.length) {
            // Remaining old lines
            diff += `@@ -${i + 1},${oldLines.length - i} +${newLines.length},0 @@\n`;
            while (i < oldLines.length) {
                diff += `-${oldLines[i]}\n`;
                i++;
            }
            break;
        }
        else if (oldLines[i] === newLines[j]) {
            // Lines match, continue
            i++;
            j++;
        }
        else {
            // Find the extent of the change
            const hunkStart = i;
            const hunkStartNew = j;
            // Find how many lines differ
            while (i < oldLines.length && j < newLines.length && oldLines[i] !== newLines[j]) {
                i++;
                j++;
            }
            diff += `@@ -${hunkStart + 1},${i - hunkStart} +${hunkStartNew + 1},${j - hunkStartNew} @@\n`;
            for (let k = hunkStart; k < i; k++) {
                diff += `-${oldLines[k]}\n`;
            }
            for (let k = hunkStartNew; k < j; k++) {
                diff += `+${newLines[k]}\n`;
            }
        }
    }
    return diff;
}
