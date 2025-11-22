/**
 * GameBuster Game Processor
 * Build-time tool for processing uploaded games and injecting GBSDK
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const crypto = require('crypto');

class GameProcessor {
    constructor(options = {}) {
        this.options = {
            gbsdkCdnUrl: 'https://unpkg.com/@gamebuster/gbsdk@latest/dist/index.umd.js',
            configBaseUrl: 'https://your-cdn.gamebuster.gg/ads/config.json', // TODO: Replace with your actual URL
            ...options
        };
    }

    /**
     * Process uploaded game and inject GBSDK
     * @param {string} gameDir - Path to extracted game directory
     * @param {Object} gameMetadata - Game metadata from upload
     * @returns {Promise<Object>} - Processing result
     */
    async processGame(gameDir, gameMetadata) {
        console.log(`Processing game: ${gameMetadata.gameId}`);

        try {
            // 1. Find and analyze index.html
            const indexPath = this.findIndexHtml(gameDir);
            if (!indexPath) {
                throw new Error('index.html not found');
            }

            // 2. Analyze game structure
            const analysis = await this.analyzeGame(indexPath, gameDir);

            // 3. Generate enhanced metadata
            const enhancedMetadata = this.enhanceMetadata(gameMetadata, analysis);

            // 4. Inject GBSDK into HTML
            await this.injectGBSDK(indexPath, enhancedMetadata);

            // 5. Generate game-specific config
            const configUrl = await this.generateGameConfig(enhancedMetadata);

            // 6. Optimize assets (optional)
            await this.optimizeAssets(gameDir);

            return {
                success: true,
                gameId: enhancedMetadata.gameId,
                configUrl,
                metadata: enhancedMetadata,
                analysis
            };

        } catch (error) {
            console.error(`Game processing failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Find index.html in game directory
     */
    findIndexHtml(gameDir) {
        const possiblePaths = [
            path.join(gameDir, 'index.html'),
            path.join(gameDir, 'index.htm'),
            path.join(gameDir, 'game.html'),
            path.join(gameDir, 'main.html')
        ];

        for (const htmlPath of possiblePaths) {
            if (fs.existsSync(htmlPath)) {
                return htmlPath;
            }
        }

        return null;
    }

    /**
     * Analyze game structure and detect framework
     */
    async analyzeGame(indexPath, gameDir) {
        const html = fs.readFileSync(indexPath, 'utf8');
        const $ = cheerio.load(html);

        const analysis = {
            title: $('title').text() || 'Untitled Game',
            framework: 'unknown',
            hasCanvas: $('canvas').length > 0,
            scripts: [],
            stylesheets: [],
            gameSize: this.calculateGameSize(gameDir)
        };

        // Detect game framework
        $('script').each((i, elem) => {
            const src = $(elem).attr('src') || '';
            const content = $(elem).html() || '';

            analysis.scripts.push({ src, hasContent: content.length > 0 });

            // Framework detection
            if (src.includes('unity') || content.includes('UnityLoader')) {
                analysis.framework = 'unity';
            } else if (src.includes('phaser') || content.includes('Phaser')) {
                analysis.framework = 'phaser';
            } else if (src.includes('pixi') || content.includes('PIXI')) {
                analysis.framework = 'pixi';
            } else if (src.includes('construct') || content.includes('cr_')) {
                analysis.framework = 'construct3';
            }
        });

        return analysis;
    }

    /**
     * Enhance metadata with analysis results
     */
    enhanceMetadata(gameMetadata, analysis) {
        return {
            ...gameMetadata,
            gameTitle: analysis.title || gameMetadata.gameTitle,
            framework: analysis.framework,
            hasCanvas: analysis.hasCanvas,
            gameSize: analysis.gameSize,
            processedAt: new Date().toISOString(),
            sdkVersion: require('../package.json').version,
            configHash: this.generateConfigHash(gameMetadata)
        };
    }

    /**
     * Inject GBSDK into HTML file
     */
    async injectGBSDK(indexPath, metadata) {
        const html = fs.readFileSync(indexPath, 'utf8');
        const $ = cheerio.load(html);

        // 1. Add meta tags for game metadata
        this.addMetaTags($, metadata);

        // 2. Inject global metadata object
        this.injectMetadataScript($, metadata);

        // 3. Add GBSDK script
        this.addGBSDKScript($, metadata);

        // 4. Add initialization script
        this.addInitScript($, metadata);

        // 5. Write modified HTML
        fs.writeFileSync(indexPath, $.html(), 'utf8');

        console.log(`GBSDK injected into ${indexPath}`);
    }

    /**
     * Add meta tags for game metadata
     */
    addMetaTags($, metadata) {
        const head = $('head');

        // Remove existing GBSDK meta tags
        $('meta[name^="gbsdk:"]').remove();

        // Add new meta tags
        const metaTags = [
            { name: 'gbsdk:game-id', content: metadata.gameId },
            { name: 'gbsdk:game-title', content: metadata.gameTitle },
            { name: 'gbsdk:version', content: metadata.version || '1.0.0' },
            { name: 'gbsdk:framework', content: metadata.framework },
            { name: 'gbsdk:processed-at', content: metadata.processedAt },
            { name: 'gbsdk:config-hash', content: metadata.configHash }
        ];

        if (metadata.category) {
            metaTags.push({ name: 'gbsdk:category', content: metadata.category });
        }

        if (metadata.tags && metadata.tags.length > 0) {
            metaTags.push({ name: 'gbsdk:tags', content: metadata.tags.join(',') });
        }

        metaTags.forEach(tag => {
            head.append(`<meta name="${tag.name}" content="${tag.content}">`);
        });
    }

    /**
     * Inject metadata as global JavaScript object
     */
    injectMetadataScript($, metadata) {
        const metadataScript = `
            <script>
                // GBSDK Game Metadata (injected at build time)
                window.GBSDK_GAME_METADATA = ${JSON.stringify(metadata, null, 2)};
                console.log('GBSDK: Game metadata loaded', window.GBSDK_GAME_METADATA);
            </script>
        `;

        $('head').append(metadataScript);
    }

    /**
     * Add GBSDK script tag
     */
    addGBSDKScript($, metadata) {
        // Remove existing GBSDK scripts
        $('script[src*="gbsdk"]').remove();

        // Add GBSDK script before any game scripts
        const gbsdkScript = `<script src="${this.options.gbsdkCdnUrl}"></script>`;

        // Find first game script and insert before it
        const firstScript = $('script[src]').first();
        if (firstScript.length > 0) {
            firstScript.before(gbsdkScript);
        } else {
            $('head').append(gbsdkScript);
        }
    }

    /**
     * Add auto-initialization script
     */
    addInitScript($, metadata) {
        const initScript = `
            <script>
                // GBSDK Auto-initialization (injected at build time)
                window.addEventListener('DOMContentLoaded', function() {
                    if (typeof GBSDK !== 'undefined' && GBSDK.GBSDK) {
                        console.log('GBSDK: Auto-initializing...');
                        
                        window.gbsdk = new GBSDK.GBSDK();
                        window.gbsdk.init().then(function() {
                            console.log('GBSDK: Auto-initialization complete');
                            
                            // Auto-track game start
                            window.gbsdk.gameStarted();
                            
                            // Make available globally for game code
                            window.GameBusterSDK = window.gbsdk;
                            
                            // Dispatch ready event
                            window.dispatchEvent(new CustomEvent('gbsdk-ready', { 
                                detail: { sdk: window.gbsdk } 
                            }));
                        }).catch(function(error) {
                            console.error('GBSDK: Auto-initialization failed', error);
                        });
                    } else {
                        console.error('GBSDK: SDK not found, auto-initialization failed');
                    }
                });
            </script>
        `;

        $('head').append(initScript);
    }

    /**
     * Generate game-specific configuration
     */
    async generateGameConfig(metadata) {
        const config = {
            version: "1.0.0",
            gameId: metadata.gameId,
            gameTitle: metadata.gameTitle,
            framework: metadata.framework,
            processedAt: metadata.processedAt,

            interstitial: {
                tags: [
                    `https://your-ads.gamebuster.gg/vast/interstitial?game=${metadata.gameId}&framework=${metadata.framework}`,
                    `https://your-backup-ads.gamebuster.gg/vast/interstitial?game=${metadata.gameId}`
                ],
                cooldownSec: 90,
                sessionCap: 10
            },

            rewarded: {
                tags: [
                    `https://your-ads.gamebuster.gg/vast/rewarded?game=${metadata.gameId}&framework=${metadata.framework}`,
                    `https://your-backup-ads.gamebuster.gg/vast/rewarded?game=${metadata.gameId}`
                ],
                cooldownSec: 60,
                sessionCap: 5
            },

            analytics: {
                enabled: true,
                gameId: metadata.gameId,
                trackingEndpoint: `https://your-analytics.gamebuster.gg/track?game=${metadata.gameId}`
            }
        };

        // Save config file
        const configPath = path.join(__dirname, '..', 'configs', `${metadata.gameId}.json`);
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const configUrl = `${this.options.configBaseUrl}?game_id=${metadata.gameId}&hash=${metadata.configHash}`;
        console.log(`Generated config: ${configUrl}`);

        return configUrl;
    }

    /**
     * Calculate total game size
     */
    calculateGameSize(gameDir) {
        let totalSize = 0;

        const calculateDirSize = (dir) => {
            const files = fs.readdirSync(dir);

            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (stats.isDirectory()) {
                    calculateDirSize(filePath);
                } else {
                    totalSize += stats.size;
                }
            });
        };

        calculateDirSize(gameDir);
        return totalSize;
    }

    /**
     * Generate config hash for caching
     */
    generateConfigHash(metadata) {
        const hashData = `${metadata.gameId}-${metadata.version}-${Date.now()}`;
        return crypto.createHash('md5').update(hashData).digest('hex').substring(0, 8);
    }

    /**
     * Optimize game assets (placeholder)
     */
    async optimizeAssets(gameDir) {
        // TODO: Implement asset optimization
        // - Compress images
        // - Minify JS/CSS
        // - Generate WebP versions
        console.log(`Asset optimization for ${gameDir} (placeholder)`);
    }
}

module.exports = GameProcessor;

// Example usage:
/*
const processor = new GameProcessor();

const gameMetadata = {
    gameId: 'subway-surfers',
    gameTitle: 'Subway Surfers',
    category: 'arcade',
    tags: ['endless', 'runner', 'mobile'],
    version: '1.2.0',
    uploadedBy: 'developer123'
};

processor.processGame('./games/subway-surfers', gameMetadata)
    .then(result => {
        console.log('Processing result:', result);
    })
    .catch(error => {
        console.error('Processing failed:', error);
    });
*/
