import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import logger from '../logger.js';
import { resolveSearchDirs } from '../core/config.js';
export const AhkRecentArgsSchema = z.object({
    scriptDir: z.string().optional(),
    extraDirs: z.array(z.string()).optional().default([]),
    limit: z.number().min(1).max(50).optional().default(10),
    patterns: z.array(z.string()).optional().default(['*.ahk']),
});
export const ahkRecentToolDefinition = {
    name: 'ahk_recent_scripts',
    description: 'List the most recent AutoHotkey scripts from configured directories. Supports overriding A_ScriptDir.',
    inputSchema: {
        type: 'object',
        properties: {
            scriptDir: { type: 'string', description: 'Override for A_ScriptDir/root scanning directory' },
            extraDirs: { type: 'array', items: { type: 'string' }, description: 'Additional directories to scan' },
            limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
            patterns: { type: 'array', items: { type: 'string' }, default: ['*.ahk'], description: 'File glob patterns to include' }
        }
    }
};
function enumerateFiles(dir, patterns) {
    try {
        if (!fs.existsSync(dir))
            return [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const results = [];
        for (const ent of entries) {
            if (!ent.isFile())
                continue;
            const fileName = ent.name;
            const matches = patterns.some((pat) => matchesPattern(fileName, pat));
            if (!matches)
                continue;
            const fullPath = path.join(dir, fileName);
            try {
                const stat = fs.statSync(fullPath);
                results.push({ fullPath, lastWriteTime: stat.mtimeMs });
            }
            catch { }
        }
        return results;
    }
    catch (err) {
        logger.warn('enumerateFiles error:', { dir, err: String(err) });
        return [];
    }
}
function matchesPattern(fileName, pattern) {
    // very small glob: supports leading/trailing * and case-insensitive .ahk
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let rx = '^' + pattern.split('*').map(esc).join('.*') + '$';
    const regex = new RegExp(rx, 'i');
    return regex.test(fileName);
}
export class AhkRecentTool {
    async execute(args) {
        try {
            const { scriptDir, extraDirs, limit, patterns } = AhkRecentArgsSchema.parse(args || {});
            // Resolve directories: arg -> config -> env -> cwd
            const searchDirs = resolveSearchDirs(scriptDir, extraDirs);
            // Scan only top-level of each directory for performance
            let found = [];
            for (const d of searchDirs) {
                found.push(...enumerateFiles(d, patterns));
            }
            // Sort by last write time desc and de-duplicate by path
            found.sort((a, b) => b.lastWriteTime - a.lastWriteTime);
            const seen = new Set();
            const unique = [];
            for (const f of found) {
                if (seen.has(f.fullPath))
                    continue;
                seen.add(f.fullPath);
                unique.push(f);
                if (unique.length >= limit)
                    break;
            }
            const items = unique.map((f) => ({
                path: f.fullPath,
                lastWriteTime: new Date(f.lastWriteTime).toISOString(),
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: items.length
                            ? items.map((i, idx) => `${idx + 1}) ${i.path} — ${i.lastWriteTime}`).join('\n')
                            : 'No scripts found.',
                    },
                    {
                        type: 'text',
                        text: JSON.stringify({
                            directoriesSearched: searchDirs,
                            patterns,
                            limit,
                            items,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            logger.error('Error in ahk_recent_scripts tool:', error);
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true,
            };
        }
    }
}
