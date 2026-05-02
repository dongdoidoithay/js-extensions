import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '../src');
const REPO_DIR = path.join(__dirname, '../repo');
const OUTPUT_FILE = path.join(REPO_DIR, 'index.min.json');

// Ensure repo dir exists
if (!fs.existsSync(REPO_DIR)) {
  fs.mkdirSync(REPO_DIR, { recursive: true });
}

interface SourceConfig {
  id: string | number;
  name: string;
  lang: string;
  baseUrl: string;
  version: string;
  [key: string]: any;
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, fileList);
    } else if (filePath.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function buildRepo() {
  console.log('Building Extension Repository...');
  const jsonFiles = walkDir(SRC_DIR);
  const repoData: SourceConfig[] = [];

  for (const file of jsonFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const config: SourceConfig = JSON.parse(content);
      
      // Basic validation
      if (!config.id || !config.name || !config.lang || !config.baseUrl) {
        console.warn(`[WARNING] Skipping invalid config: ${file}`);
        continue;
      }
      
      // Assign version if not present
      if (!config.version) config.version = '1.0.0';

      repoData.push(config);
      console.log(`- Added: [${config.lang}] ${config.name}`);
    } catch (err) {
      console.error(`[ERROR] Failed to parse ${file}:`, err);
    }
  }

  // Write minified JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(repoData));
  console.log(`\nSuccess! Built ${repoData.length} extensions into ${OUTPUT_FILE}`);
}

buildRepo();
