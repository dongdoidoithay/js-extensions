import * as fs from 'fs';
import * as path from 'path';

const REPO_DIR = path.join(__dirname, '../repo');

// Ensure repo dir exists
if (!fs.existsSync(REPO_DIR)) {
  fs.mkdirSync(REPO_DIR, { recursive: true });
}

type BuildTarget = 'manga' | 'mp3' | 'novel'| 'comic'|'mp4'|'mp4-hard'|'truyen-ma'|'film-2k'|'audio-rss';
type Mp3Store = 'default' | 'google' | 'amazon';

type TargetConfig = {
  srcDir: string;
  outputFile: string;
  mockupDir?: string;
  mockupFileName: string;
  label: string;
};

type Mp3StoreConfig = {
  outputFileName: string;
  mockupFileName: string;
  includeFiles?: string[];
};

const TARGETS: Record<BuildTarget, TargetConfig> = {
  manga: {
    srcDir: path.join(__dirname, '../src'),
    outputFile: path.join(REPO_DIR, 'manga.min.json'),
    mockupDir: path.join(__dirname, '../../manga-extension/src/core/data-mockup'),
    mockupFileName: 'manga.min.json',
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
  comic: {
    srcDir: path.join(__dirname, '../src-comic'),
    outputFile: path.join(REPO_DIR, 'comic.min.json'),
    mockupDir: path.join(__dirname, '../../comic-extension/src/core/data-mockup'),
    mockupFileName: 'comic.min.json',
    label: 'comic',
  },
  mp4: {
    srcDir: path.join(__dirname, '../src-mp4'),
    outputFile: path.join(REPO_DIR, 'mp4.min.json'),
    mockupDir: path.join(__dirname, '../../mp4-extension/src/core/data-mockup'),
    mockupFileName: 'mp4.min.json',
    label: 'mp4',
  },
  'mp4-hard': {
    srcDir: path.join(__dirname, '../src-mp4-hard'),
    outputFile: path.join(REPO_DIR, 'mp4-hard.min.json'),
    mockupDir: path.join(__dirname, '../../mp4-hard-extension/src/core/data-mockup'),
    mockupFileName: 'mp4-hard.min.json',
    label: 'mp4-hard',
  },
    'truyen-ma': {
    srcDir: path.join(__dirname, '../src-truyen-ma'),
    outputFile: path.join(REPO_DIR, 'mp3-truyen-ma.min.json'),
    mockupDir: path.join(__dirname, '../../mp3-truyen-ma/src/core/data-mockup'),
    mockupFileName: 'mp3-truyen-ma.min.json',
    label: 'mp3-truyen-ma',
  },
  'film-2k': {
    srcDir: path.join(__dirname, '../src-film-2k'),
    outputFile: path.join(REPO_DIR, 'film-2k.min.json'),
    mockupDir: path.join(__dirname, '../../film-2k-extension/src/core/data-mockup'),
    mockupFileName: 'film-2k.min.json',
    label: 'film-2k',
  },
  'audio-rss': {
    srcDir: path.join(__dirname, '../src-audio-rss'),
    outputFile: path.join(REPO_DIR, 'mp3-audiorss.json'),
    mockupDir: path.join(__dirname, '../../mp3-audio-rss/src/core/data-mockup'),
    mockupFileName: 'mp3-audiorss.json',
    label: 'audio-rss',
  },
};

const MP3_STORE_CONFIGS: Record<Mp3Store, Mp3StoreConfig> = {
  default: {
    outputFileName: 'mp3.min.json',
    mockupFileName: 'mp3.min.json',
  },
  google: {
    outputFileName: 'mp3-google.min.json',
    mockupFileName: 'mp3-google.min.json',
    // Keep this list strict for Google build policy.
    includeFiles: [
     'vi/nghetruyenma_net_vi.json',
    ],
  },
  amazon: {
    outputFileName: 'mp3-amazon.min.json',
    mockupFileName: 'mp3-amazon.min.json',
    includeFiles: [
      'vi/nghetruyenma_net_vi.json',
    ],
  },
};

type BuildOptions = {
  targets: BuildTarget[];
  mp3Store: Mp3Store;
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

function parseTargets(args: string[]): BuildTarget[] {

  if (args.length === 0) {
    return ['manga', 'mp3', 'novel', 'comic', 'mp4', 'mp4-hard','truyen-ma', 'film-2k', 'audio-rss'];
  }

  if (args.includes('all')) {
    return ['manga', 'mp3', 'novel', 'comic', 'mp4', 'mp4-hard','comic', 'truyen-ma','film-2k', 'audio-rss'];
  }

  const targets = args.filter((value): value is BuildTarget => value in TARGETS);

  if (targets.length === 0) {
    const allowed = [...Object.keys(TARGETS), 'all'].join(', ');
    throw new Error(`Invalid build target. Use one of: ${allowed}`);
  }

  return Array.from(new Set(targets));
}

function normalizeRelativePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function parseOptions(argv: string[]): BuildOptions {
  const args = argv.map((value) => value.toLowerCase());
  const targetArgs: string[] = [];
  let mp3Store: Mp3Store = 'default';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--store' || arg === '--mp3-store') {
      const nextValue = args[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for --store. Use one of: default, google, amazon');
      }
      if (!(nextValue in MP3_STORE_CONFIGS)) {
        throw new Error(`Invalid mp3 store: ${nextValue}. Use one of: default, google, amazon`);
      }
      mp3Store = nextValue as Mp3Store;
      index += 1;
      continue;
    }

    targetArgs.push(arg);
  }

  return {
    targets: parseTargets(targetArgs),
    mp3Store,
  };
}

function buildRepo(target: BuildTarget, options: BuildOptions) {
  const config = TARGETS[target];
  const mp3Store = target === 'mp3' ? options.mp3Store : 'default';
  const mp3StoreConfig = MP3_STORE_CONFIGS[mp3Store];
  const outputFile =
    target === 'mp3' ? path.join(REPO_DIR, mp3StoreConfig.outputFileName) : config.outputFile;
  const mockupFileName = target === 'mp3' ? mp3StoreConfig.mockupFileName : config.mockupFileName;

  const buildLabel = target === 'mp3' ? `${config.label} (${mp3Store})` : config.label;
  console.log(`Building ${buildLabel} extension repository...`);

  if (!fs.existsSync(config.srcDir)) {
    throw new Error(`Source directory not found: ${config.srcDir}`);
  }

  let jsonFiles = walkDir(config.srcDir);

  if (target === 'mp3' && mp3StoreConfig.includeFiles && mp3StoreConfig.includeFiles.length > 0) {
    const includeSet = new Set(mp3StoreConfig.includeFiles.map(normalizeRelativePath));

    const missingFiles = Array.from(includeSet).filter((relativeFile) => {
      return !fs.existsSync(path.join(config.srcDir, relativeFile));
    });
    if (missingFiles.length > 0) {
      throw new Error(
        `Missing configured mp3 source files for store ${mp3Store}: ${missingFiles.join(', ')}`,
      );
    }

    jsonFiles = jsonFiles.filter((filePath) => {
      const relativePath = normalizeRelativePath(path.relative(config.srcDir, filePath));
      return includeSet.has(relativePath);
    });
  }

  const repoData: SourceConfig[] = [];

  for (const file of jsonFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const config: SourceConfig = JSON.parse(content);

      // Basic validation — allow empty baseUrl for RSS sources (they use full paths per entry)
      const isRssSource = config.sourceType === 'rss';
      if (!config.id || !config.name || !config.lang || (!isRssSource && !config.baseUrl)) {
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
  fs.writeFileSync(outputFile, JSON.stringify(repoData));
  console.log(`\nSuccess! Built ${repoData.length} extensions into ${outputFile}`);

  if (config.mockupDir && fs.existsSync(config.mockupDir)) {
    const mockupFile = path.join(config.mockupDir, mockupFileName);
    fs.copyFileSync(outputFile, mockupFile);
    console.log(`- Copied to mockup: ${mockupFile}`);
  }
}

function main() {
  const options = parseOptions(process.argv.slice(2));

  for (const target of options.targets) {
    buildRepo(target, options);
  }
}

main();
