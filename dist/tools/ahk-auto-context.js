import { getAhkIndex } from '../core/loader.js';
import logger from '../logger.js';
export class AhkAutoContextProvider {
    constructor() {
        this.keywordContextMap = new Map();
        this.config = {
            triggerKeywords: [
                'clipboard', 'gui', 'window', 'file', 'hotkey', 'string',
                'array', 'map', 'loop', 'message', 'monitor', 'mouse',
                'keyboard', 'time', 'toggle', 'button', 'text', 'send'
            ],
            maxContextItems: 3,
            includeExamples: true
        };
        this.initializeContextMap();
    }
    static getInstance() {
        if (!AhkAutoContextProvider.instance) {
            AhkAutoContextProvider.instance = new AhkAutoContextProvider();
        }
        return AhkAutoContextProvider.instance;
    }
    async initializeContextMap() {
        const ahkIndex = getAhkIndex();
        if (!ahkIndex) {
            logger.warn('AutoHotkey index not available for auto-context');
            return;
        }
        // Map keywords to relevant documentation
        this.keywordContextMap.set('clipboard', [
            ahkIndex.variables?.find((v) => v.Name === 'A_Clipboard'),
            ahkIndex.functions?.find((f) => f.Name.includes('OnClipboardChange')),
        ].filter(Boolean));
        this.keywordContextMap.set('gui', [
            ahkIndex.classes?.find((c) => c.Name === 'Gui'),
            ahkIndex.methods?.find((m) => m.Name === 'Add' && m.Path === 'Gui'),
            ahkIndex.methods?.find((m) => m.Name === 'Show' && m.Path === 'Gui'),
        ].filter(Boolean));
        this.keywordContextMap.set('file', [
            ahkIndex.functions?.find((f) => f.Name.includes('FileRead')),
            ahkIndex.functions?.find((f) => f.Name.includes('FileWrite')),
            ahkIndex.variables?.find((v) => v.Name === 'A_WorkingDir'),
        ].filter(Boolean));
        this.keywordContextMap.set('message', [
            ahkIndex.functions?.find((f) => f.Name.includes('MsgBox')),
            ahkIndex.functions?.find((f) => f.Name.includes('ToolTip')),
        ].filter(Boolean));
        this.keywordContextMap.set('hotkey', [
            ahkIndex.functions?.find((f) => f.Name.includes('Send')),
            ahkIndex.functions?.find((f) => f.Name.includes('Hotkey')),
        ].filter(Boolean));
        this.keywordContextMap.set('array', [
            ahkIndex.classes?.find((c) => c.Name === 'Array'),
        ].filter(Boolean));
        this.keywordContextMap.set('map', [
            ahkIndex.classes?.find((c) => c.Name === 'Map'),
        ].filter(Boolean));
        logger.info('Auto-context keyword mapping initialized');
    }
    analyzeAndGenerateContext(userInput, llmThinking) {
        const combinedText = `${userInput} ${llmThinking || ''}`.toLowerCase();
        const detectedKeywords = this.detectKeywords(combinedText);
        if (detectedKeywords.length === 0) {
            return null;
        }
        return this.generateContextForKeywords(detectedKeywords);
    }
    detectKeywords(text) {
        const detected = [];
        for (const keyword of this.config.triggerKeywords) {
            if (text.includes(keyword)) {
                detected.push(keyword);
            }
        }
        // Also check for AutoHotkey function patterns
        const ahkPatterns = [
            /\b(msgbox|tooltip|send|click|hotkey|gui|fileread|filewrite)\b/gi,
            /\b(a_\w+)\b/gi, // Built-in variables like A_Clipboard
        ];
        for (const pattern of ahkPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                detected.push(...matches.map(m => m.toLowerCase()));
            }
        }
        return [...new Set(detected)]; // Remove duplicates
    }
    generateContextForKeywords(keywords) {
        let contextText = '## 🎯 AutoHotkey v2 Context (Auto-Injected)\n\n';
        let hasContent = false;
        for (const keyword of keywords.slice(0, this.config.maxContextItems)) {
            const contextItems = this.keywordContextMap.get(keyword);
            if (!contextItems || contextItems.length === 0)
                continue;
            hasContent = true;
            contextText += `### ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Related:\n\n`;
            for (const item of contextItems.slice(0, 2)) { // Limit to 2 items per keyword
                if (item.Name && item.Description) {
                    contextText += `**${item.Name}**: ${item.Description}\n`;
                    if (this.config.includeExamples && item.Examples && item.Examples.length > 0) {
                        contextText += `\n*Example:*\n\`\`\`autohotkey\n${item.Examples[0].Code}\n\`\`\`\n`;
                    }
                    contextText += '\n';
                }
            }
        }
        if (!hasContent) {
            return '';
        }
        contextText += '*💡 This context was automatically provided based on detected keywords in your request.*\n\n';
        return contextText;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        logger.info('Auto-context configuration updated');
    }
    getDetectedKeywords(text) {
        return this.detectKeywords(text.toLowerCase());
    }
}
