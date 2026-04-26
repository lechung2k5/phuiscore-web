const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, target, replacement) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(target, replacement);
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Updated:', filePath);
    }
}

// 1. Centralize the config
const apiConfigPath = 'packages/app/utils/api-config.ts';
if (!fs.existsSync(path.dirname(apiConfigPath))) fs.mkdirSync(path.dirname(apiConfigPath), { recursive: true });
fs.writeFileSync(apiConfigPath, "export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';\n", 'utf8');

// 2. Update key files
replaceInFile('packages/app/components/News/NewsScreen.tsx', 
    "const API = 'http://localhost:5000/api'", 
    "import { API_URL as API } from '../../utils/api-config'");

replaceInFile('packages/app/components/FeaturedLeagues.tsx', 
    "const API = 'http://localhost:5000/api'", 
    "import { API_URL as API } from '../utils/api-config'");

replaceInFile('packages/app/components/Header.tsx', 
    "const API = 'http://localhost:5000/api'", 
    "import { API_URL as API } from '../utils/api-config'");

replaceInFile('apps/server/src/index.js',
    "const url = `http://localhost:5000/uploads/tournaments/${safeName}`;",
    "const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5000';\n        const url = `${baseUrl}/uploads/tournaments/${safeName}`;");
