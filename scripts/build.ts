import * as fs from 'fs';
import * as path from 'path';

const REPO_DIR = path.join(__dirname, '../repo');

// Ensure repo dir exists
if (!fs.existsSync(REPO_DIR)) {
  fs.mkdirSync(REPO_DIR, { recursive: true });
}

type BuildTarget = 'manga' | 'mp3' | 'novel';

type TargetConfig = {
  srcDir: string;
  outputFile: string;
  mockupDir?: string;
  mockupFileName: string;
  label: string;
};

const TARGETS: Record<BuildTarget, TargetConfig> = {
  manga: {
    srcDir: path.join(__dirname, '../src'),
    outputFile: path.join(REPO_DIR, 'index.min.json'),
    mockupDir: path.join(__dirname, '../../manga-extension/src/core/data-mockup'),
    mockupFileName: 'index.min.json',
    label: 'manga',
  },
  mp3: {
    srcDir: path.join(__dirname, '../src-mp3'),
    outputFile: path.join(REPO_DIR, 'mp3.min.json'),
    mockupDir: path.join(__dirname, '../../mp3-extension/src/core/data-mockup'),
    mockupFileName: 'mp3.min.json',
    label: 'mp3',
  },
  novel: {
    srcDir: path.join(__dirname, '../src-novel'),
    outputFile: path.join(REPO_DIR, 'novel.min.json'),
    mockupDir: path.join(__dirname, '../../novel-extension/src/core/data-mockup'),
    mockupFileName: 'novel.min.json',
    label: 'novel',
  },
};

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
    if (file === 'check_json.js' || file === 'checklist.md') continue;

    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, fileList);
    } else if (filePath.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function parseTargets(argv: string[]): BuildTarget[] {
  const args = argv.map((value) => value.toLowerCase());

  if (args.length === 0) {
    return ['manga', 'mp3', 'novel'];
  }

  if (args.includes('all')) {
    return ['manga', 'mp3', 'novel'];
  }

  const targets = args.filter((value): value is BuildTarget => value in TARGETS);

  if (targets.length === 0) {
    const allowed = [...Object.keys(TARGETS), 'all'].join(', ');
    throw new Error(`Invalid build target. Use one of: ${allowed}`);
  }

  return Array.from(new Set(targets));
}

function buildRepo(target: BuildTarget) {
  const config = TARGETS[target];
  console.log(`Building ${config.label} extension repository...`);

  if (!fs.existsSync(config.srcDir)) {
    throw new Error(`Source directory not found: ${config.srcDir}`);
  }

  const jsonFiles = walkDir(config.srcDir);
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
  fs.writeFileSync(config.outputFile, JSON.stringify(repoData));
  console.log(`\nSuccess! Built ${repoData.length} extensions into ${config.outputFile}`);

  if (config.mockupDir && fs.existsSync(config.mockupDir)) {
    const mockupFile = path.join(config.mockupDir, config.mockupFileName);
    fs.copyFileSync(config.outputFile, mockupFile);
    console.log(`- Copied to mockup: ${mockupFile}`);
  }
}

function main() {
  const targets = parseTargets(process.argv.slice(2));

  for (const target of targets) {
    buildRepo(target);
  }
}

main();
