const fs = require('fs');
const path = require('path');

const dir = __dirname;
const templatePath = path.join(dir, 'nettruyen.json');

if (!fs.existsSync(templatePath)) {
    console.error(`Template not found at ${templatePath}`);
    process.exit(1);
}

const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'nettruyen.json');

const report = [];

files.forEach(file => {
    const filePath = path.join(dir, file);
    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const errors = [];

        // Check top level keys
        ['id', 'name', 'lang', 'baseUrl', 'version', 'supportsLatest', 'latest', 'search', 'mangaDetails', 'chapterList', 'pageList'].forEach(key => {
            if (!(key in content)) {
                errors.push(`Missing top-level key: ${key}`);
            }
        });

        // Check tags or popular (template uses tags)
        if (!content.tags && !content.popular) {
            errors.push('Missing tags or popular key');
        }

        if (errors.length > 0) {
            report.push({ file, errors });
        }
    } catch (e) {
        report.push({ file, errors: [`JSON Parse Error: ${e.message}`] });
    }
});

if (report.length === 0) {
    console.log('All JSON files are valid according to the template rules.');
} else {
    console.log(JSON.stringify(report, null, 2));
}

