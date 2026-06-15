const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'vmix-overlay-system', 'client', 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace `import varName from '../assets/some/path.png';`
        // With `const varName = '/assets/some/path.png';`
        const regex = /import\s+([a-zA-Z0-9_]+)\s+from\s+['"](?:\.\.\/)+assets\/(.+?)['"];/g;
        
        if (regex.test(content)) {
            content = content.replace(regex, (match, varName, assetPath) => {
                return `const ${varName} = '/assets/${assetPath}';`;
            });
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Modified:', filePath);
        }
    }
});
