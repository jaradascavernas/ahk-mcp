// Simple logger that writes only to stderr to prevent stdout pollution
class StderrLogger {
    shouldLog(level) {
        const currentLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
        const levels = ['error', 'warn', 'info', 'debug'];
        const currentLevelIndex = levels.indexOf(currentLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }
    log(level, ...args) {
        if (!this.shouldLog(level))
            return;
        const timestamp = new Date().toISOString();
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
        // Write directly to stderr to avoid stdout pollution
        process.stderr.write(`[${timestamp}] ${level.toUpperCase()}: ${message}\n`);
    }
    error(...args) {
        this.log('error', ...args);
    }
    warn(...args) {
        this.log('warn', ...args);
    }
    info(...args) {
        this.log('info', ...args);
    }
    debug(...args) {
        this.log('debug', ...args);
    }
}
const logger = new StderrLogger();
// Override console methods to prevent accidental stdout usage
// This is a failsafe in case any dependency tries to use console.log
const originalConsoleLog = console.log;
console.log = (...args) => {
    // Redirect to stderr instead of stdout
    process.stderr.write('[CONSOLE.LOG REDIRECTED] ' + args.join(' ') + '\n');
};
export default logger;
