const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
    console.log(`Processing ${filePath}`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Define import path mappings based on the file's location
        const importMappings = [
            // General engine paths
            {
                pattern: /from ['"]\.\.\/engine\/core\/([^'"]+)['"]/g, 
                replacement: (match, p1) => `from '../../core/${p1}'`
            },
            // Skill tree paths
            {
                pattern: /from ['"]\.\.\/engine\/effects\/skill-tree\/([^'"]+)['"]/g,
                replacement: (match, p1) => `from '../../systems/skill_tree/${p1.replace('-', '_')}'`
            },
            // Effect handler paths
            {
                pattern: /from ['"]\.\.\/engine\/effects\/handler\/([^'"]+)['"]/g,
                replacement: (match, p1) => `from '../../systems/effects/${p1.replace('-', '_')}'`
            },
            // Node paths
            {
                pattern: /from ['"]\.\.\/engine\/node[_-]([^'"]+)['"]/g,
                replacement: (match, p1) => `from '../../entities/nodes/node_${p1}'`
            },
            // UI component paths
            {
                pattern: /from ['"]\.\.\/ui\/([^'"\/]+)\/([^'"]+)['"]/g,
                replacement: (match, folder, file) => `from '../../ui/components/${file}'`
            }
        ];
        
        let updatedContent = content;
        for (const mapping of importMappings) {
            updatedContent = updatedContent.replace(mapping.pattern, mapping.replacement);
        }
        
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent);
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
        return false;
    }
}

function fixImportsInDirectory(directory) {
    let successCount = 0;
    
    try {
        const files = fs.readdirSync(directory, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(directory, file.name);
            
            if (file.isDirectory()) {
                successCount += fixImportsInDirectory(fullPath);
            } else if (file.name.endsWith('.js')) {
                if (fixImportsInFile(fullPath)) {
                    successCount++;
                }
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${directory}:`, err);
    }
    
    return successCount;
}

const targetDir = process.argv[2] || "frontend/src";
console.log(`Fixing JavaScript imports in ${targetDir}...`);
const count = fixImportsInDirectory(targetDir);
console.log(`Updated ${count} JavaScript files.`);
