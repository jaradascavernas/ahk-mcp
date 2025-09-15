import path from 'path';
import fs from 'fs';
import logger from '../logger.js';
import { toolSettings } from './tool-settings.js';
/**
 * Simple global variable system for active file tracking
 * ALL tools can read and write to this shared state
 */
class ActiveFileManager {
    constructor() {
        // THE SINGLE SHARED VARIABLE - this is what all tools use
        this.activeFilePath = undefined;
        // Additional tracking
        this.lastDetectedPath = undefined;
        this.lastModified = undefined;
        // Load from environment variable if set
        if (process.env.AHK_ACTIVE_FILE) {
            this.setActiveFile(process.env.AHK_ACTIVE_FILE);
        }
    }
    static getInstance() {
        if (!ActiveFileManager.instance) {
            ActiveFileManager.instance = new ActiveFileManager();
        }
        return ActiveFileManager.instance;
    }
    /**
     * Set the active file path - used by ALL tools
     */
    setActiveFile(filePath) {
        if (!filePath) {
            this.activeFilePath = undefined;
            logger.info('Active file cleared');
            return true;
        }
        // Resolve to absolute path
        const resolved = path.resolve(filePath);
        // Check if it's an .ahk file
        if (!resolved.toLowerCase().endsWith('.ahk')) {
            logger.warn(`Not an AHK file: ${resolved}`);
            return false;
        }
        // Check if file exists
        if (!fs.existsSync(resolved)) {
            logger.warn(`File does not exist: ${resolved}`);
            return false;
        }
        // Set the active file
        this.activeFilePath = resolved;
        this.lastModified = new Date();
        logger.info(`✅ Active file set: ${resolved}`);
        return true;
    }
    /**
     * Get the active file path - used by ALL tools
     */
    getActiveFile() {
        return this.activeFilePath;
    }
    /**
     * Quick check if we have an active file
     */
    hasActiveFile() {
        return this.activeFilePath !== undefined;
    }
    /**
     * Try to detect and set file from any text input
     * This is called automatically by tools
     */
    detectAndSetFromText(text) {
        // Check if file detection is allowed
        if (!toolSettings.isFileDetectionAllowed()) {
            logger.debug('File detection is disabled in settings');
            return undefined;
        }
        // Simple patterns to detect file paths
        const patterns = [
            // Quoted paths
            /["']([^"']*\.ahk)["']/gi,
            // Windows paths with drive
            /([A-Z]:[\\\/][^\\\/\s"']*\.ahk)/gi,
            // Relative paths
            /((?:\.\/|\.\.\/|[^\\\/\s"']+\/)*[^\\\/\s"']+\.ahk)/gi,
            // Just filename.ahk
            /\b([\w\-]+\.ahk)\b/gi
        ];
        for (const pattern of patterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const possiblePath = match[1] || match[0];
                // Try to resolve the path
                let resolved;
                // Try as absolute path first
                if (path.isAbsolute(possiblePath) && fs.existsSync(possiblePath)) {
                    resolved = path.resolve(possiblePath);
                }
                // Try relative to current directory
                else if (fs.existsSync(path.resolve(possiblePath))) {
                    resolved = path.resolve(possiblePath);
                }
                // Try in common script directories
                else {
                    const searchDirs = [
                        process.cwd(),
                        process.env.AHK_SCRIPT_DIR,
                        path.join(process.env.USERPROFILE || '', 'Documents', 'AutoHotkey'),
                        'C:\\Scripts',
                        'C:\\AHK'
                    ].filter(Boolean);
                    for (const dir of searchDirs) {
                        const fullPath = path.join(dir, possiblePath);
                        if (fs.existsSync(fullPath)) {
                            resolved = path.resolve(fullPath);
                            break;
                        }
                    }
                }
                // If we found a valid file, set it and return
                if (resolved && this.setActiveFile(resolved)) {
                    this.lastDetectedPath = possiblePath;
                    return resolved;
                }
            }
        }
        return undefined;
    }
    /**
     * Clear the active file
     */
    clear() {
        this.activeFilePath = undefined;
        this.lastDetectedPath = undefined;
        this.lastModified = undefined;
        logger.info('Active file cleared');
    }
    /**
     * Get status information
     */
    getStatus() {
        return {
            activeFile: this.activeFilePath,
            lastDetected: this.lastDetectedPath,
            lastModified: this.lastModified,
            exists: this.activeFilePath ? fs.existsSync(this.activeFilePath) : false
        };
    }
}
// Export the singleton instance - this is THE shared variable
export const activeFile = ActiveFileManager.getInstance();
// Helper functions for easy access
export function getActiveFilePath() {
    return activeFile.getActiveFile();
}
export function setActiveFilePath(filePath) {
    return activeFile.setActiveFile(filePath);
}
export function detectFileInText(text) {
    return activeFile.detectAndSetFromText(text);
}
export function hasActiveFile() {
    return activeFile.hasActiveFile();
}
export function clearActiveFile() {
    activeFile.clear();
}
// Auto-detect file paths in any text (can be called by any tool)
export function autoDetect(text) {
    activeFile.detectAndSetFromText(text);
}
