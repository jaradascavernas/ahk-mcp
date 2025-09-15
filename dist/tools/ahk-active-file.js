import { z } from 'zod';
import logger from '../logger.js';
import { loadConfig, saveConfig, normalizeDir } from '../core/config.js';
export const AhkActiveFileArgsSchema = z.object({
    action: z.enum(['get', 'set']).default('get'),
    filePath: z.string().optional()
});
export const ahkActiveFileToolDefinition = {
    name: 'ahk_active_file',
    description: 'Get or set the active AHK file path used as a default when invoking tools.',
    inputSchema: {
        type: 'object',
        properties: {
            action: { type: 'string', enum: ['get', 'set'], default: 'get' },
            filePath: { type: 'string', description: 'Absolute AHK file path to set as active' }
        }
    }
};
export class AhkActiveFileTool {
    async execute(args) {
        try {
            const { action, filePath } = AhkActiveFileArgsSchema.parse(args || {});
            if (action === 'get') {
                const cfg = loadConfig();
                return { content: [{ type: 'text', text: JSON.stringify({ activeFile: cfg.activeFile || null }, null, 2) }] };
            }
            const cfg = loadConfig();
            if (!filePath) {
                throw new Error('filePath is required for set action');
            }
            cfg.activeFile = normalizeDir(filePath);
            saveConfig(cfg);
            return { content: [{ type: 'text', text: 'Active file updated.' }, { type: 'text', text: JSON.stringify({ activeFile: cfg.activeFile }, null, 2) }] };
        }
        catch (error) {
            logger.error('Error in ahk_active_file tool:', error);
            return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
        }
    }
}
