import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyDataFiles() {
  try {
    const sourceDir = path.join(__dirname, '..', 'data');
    const targetDir = path.join(__dirname, '..', 'dist', 'data');
    
    console.log('Copying data files...');
    console.log(`Source: ${sourceDir}`);
    console.log(`Target: ${targetDir}`);
    
    // Check if source directory exists
    if (!(await fs.pathExists(sourceDir))) {
      console.log('Source data directory does not exist, skipping copy...');
      return;
    }
    
    // Ensure target directory exists
    await fs.ensureDir(targetDir);
    
    // Copy all JSON files
    await fs.copy(sourceDir, targetDir, {
      filter: (src) => {
        return path.extname(src) === '.json' || fs.statSync(src).isDirectory();
      }
    });
    
    console.log('Data files copied successfully!');
  } catch (error) {
    console.error('Error copying data files:', error);
    // Don't exit with error code - just warn
    console.warn('Continuing build without data files...');
  }
}

copyDataFiles(); 