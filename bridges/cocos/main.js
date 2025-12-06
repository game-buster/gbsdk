const { existsSync, copySync } = require('fs-extra');
const path = require('path');

const PACKAGE_NAME = 'gbsdk';

function log(...args) {
    console.log(`[${PACKAGE_NAME}]`, ...args);
}

exports.load = function() {
    log('GameBuster SDK extension loaded');
    
    const projectPath = Editor.Project.path;
    const templatesDir = path.join(projectPath, 'extensions', PACKAGE_NAME, 'templates');
    const assetsDir = path.join(projectPath, 'assets');
    
    // Copy GBSDK API to assets
    const apiSrc = path.join(templatesDir, 'gbsdk-api');
    const apiDest = path.join(assetsDir, 'gbsdk-api');
    
    if (!existsSync(apiDest)) {
        try {
            copySync(apiSrc, apiDest);
            log('GBSDK API files copied to assets/gbsdk-api');
        } catch (error) {
            log('Error copying GBSDK API:', error);
        }
    } else {
        log('GBSDK API already exists in assets');
    }
};

exports.unload = function() {
    log('GameBuster SDK extension unloaded');
};

exports.methods = {
    openPanel() {
        Editor.Panel.open(PACKAGE_NAME);
    }
};

