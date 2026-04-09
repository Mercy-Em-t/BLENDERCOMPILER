const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;
console.log("INITIALIZING BLENDER COMPILER SERVER V2...");

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
};

http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/run-headless') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { script, blenderPath, saveBlend, render } = JSON.parse(body);
                const tempFile = path.join(__dirname, 'temp_blender_script.py');
                const resultFile = path.join(__dirname, 'output_scene.blend');
                
                let finalScript = "import bpy\nimport os\nprint('--- BLENDER_COORDINATOR_START ---')\n" + script;
                
                if (render) {
                    if (saveBlend) {
                        finalScript += `\n# Save Result\nbpy.ops.wm.save_as_mainfile(filepath="output_scene.blend")\n`;
                    }
                    finalScript += `
# Render Preview
print("--- RENDERING_START ---")
# Force Cycles for headless stability
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.render.filepath = os.path.join(os.getcwd(), "render_preview.png")
bpy.ops.render.render(write_still=True)
print(f"--- RENDER_COMPLETE: {os.path.exists('render_preview.png')} ---")
`;
                }

                fs.writeFileSync(tempFile, finalScript);

                const executable = blenderPath || 'blender';
                const blenderCmd = `"${executable}" --background --python "${tempFile}"`;
                
                console.log("Running:", blenderCmd);

                exec(blenderCmd, (error, stdout, stderr) => {
                    // Keeping tempFile for debugging as per plan

                    if (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: stderr || error.message }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            success: true, 
                            output: stdout,
                            savedFile: saveBlend ? 'output_scene.blend' : null,
                            renderFile: 'render_preview.png'
                        }));
                    }
                });
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
        });
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let filePath = '.' + parsedUrl.pathname;
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}).listen(PORT);

console.log(`Server running at http://localhost:${PORT}/`);
