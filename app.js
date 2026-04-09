/**
 * Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const nlInput = document.getElementById('nl-input');
    const compileBtn = document.getElementById('compile-btn');
    const dslOutput = document.getElementById('dsl-output').querySelector('code');
    const scriptOutput = document.getElementById('script-output').querySelector('code');
    const downloadBtn = document.getElementById('download-btn');
    const runHeadlessBtn = document.getElementById('run-headless-btn');
    const checkBtn = document.getElementById('check-connection-btn');
    const consoleBox = document.getElementById('console-output').querySelector('code');
    const previewContainer = document.getElementById('preview-container');
    const pathInput = document.getElementById('blender-path');
    const modeSelect = document.getElementById('execution-mode');
    const saveBlendCheck = document.getElementById('save-blend');
    const resetBtn = document.getElementById('reset-btn');
    const camDist = document.getElementById('cam-dist');
    const camElev = document.getElementById('cam-elev');
    const lightEnergy = document.getElementById('light-energy');

    let currentScript = "";

    // Load persisted settings
    pathInput.value = localStorage.getItem('blenderPath') || 'C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe';
    modeSelect.value = localStorage.getItem('executionMode') || 'local';
    saveBlendCheck.checked = localStorage.getItem('saveBlend') !== 'false';
    nlInput.value = localStorage.getItem('lastDescription') || '';
    scriptOutput.textContent = localStorage.getItem('lastScript') || '// Generated script will appear here';
    consoleBox.textContent = localStorage.getItem('lastConsole') || '// Blender logs will appear here...';
    currentScript = localStorage.getItem('lastScript') || "";

    const saveSettings = () => {
        localStorage.setItem('blenderPath', pathInput.value);
        localStorage.setItem('executionMode', modeSelect.value);
        localStorage.setItem('saveBlend', saveBlendCheck.checked);
        localStorage.setItem('lastDescription', nlInput.value);
        localStorage.setItem('lastScript', currentScript);
        localStorage.setItem('lastConsole', consoleBox.textContent);
        localStorage.setItem('camDist', camDist.value);
        localStorage.setItem('camElev', camElev.value);
        localStorage.setItem('lightEnergy', lightEnergy.value);
    };

    nlInput.addEventListener('input', saveSettings);
    pathInput.addEventListener('change', saveSettings);
    modeSelect.addEventListener('change', saveSettings);
    saveBlendCheck.addEventListener('change', saveSettings);
    camDist.addEventListener('input', () => { saveSettings(); compileBtn.click(); });
    camElev.addEventListener('input', () => { saveSettings(); compileBtn.click(); });
    lightEnergy.addEventListener('input', () => { saveSettings(); compileBtn.click(); });

    const logToConsole = (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '[ERROR]' : '[INFO]';
        const formattedMsg = `\n${timestamp} ${prefix} ${msg}`;
        
        // Append and trim leading newline if it's the first message
        if (consoleBox.textContent.trim() === '// Blender logs will appear here...') {
            consoleBox.textContent = formattedMsg.trim();
        } else {
            consoleBox.textContent += formattedMsg;
        }
        
        consoleBox.parentElement.scrollTop = consoleBox.parentElement.scrollHeight;
        saveSettings();
    };

    checkBtn.addEventListener('click', async () => {
        checkBtn.textContent = "Checking...";
        try {
            const response = await fetch('/run-headless', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    script: "import bpy; print('OK - Blender ' + bpy.app.version_string)",
                    blenderPath: pathInput.value
                })
            });
            const result = await response.json();
            if (result.success) {
                logToConsole("Blender Connection: " + result.output.trim());
            } else {
                logToConsole("Blender Connection Failed: " + result.error, 'error');
            }
        } catch (error) {
            logToConsole("Server Connection Failed", 'error');
        } finally {
            checkBtn.textContent = "Check Connection";
        }
    });

    compileBtn.addEventListener('click', async () => {
        const text = nlInput.value.trim();
        if (!text) return;

        compileBtn.textContent = "Compiling...";
        compileBtn.disabled = true;

        try {
            // 1. Natural Language -> DSL
            const dsl = await BlenderCompiler.translateToDSL(text);
            dslOutput.textContent = dsl;

            // 2. DSL -> Blender Script (bpy)
            const script = BlenderCompiler.generateBpyScript(dsl, {
                camDist: parseInt(camDist.value),
                camElev: parseInt(camElev.value),
                lightEnergy: parseInt(lightEnergy.value)
            });
            scriptOutput.textContent = script;
            currentScript = script;
            saveSettings();

            // Enable buttons
            downloadBtn.disabled = false;
            runHeadlessBtn.disabled = false;
        } catch (error) {
            console.error(error);
            dslOutput.textContent = "// Error processing request";
            scriptOutput.textContent = "# Error generating script";
        } finally {
            compileBtn.textContent = "Compile to DSL";
            compileBtn.disabled = false;
        }
    });

    runHeadlessBtn.addEventListener('click', async () => {
        if (!currentScript) return;

        runHeadlessBtn.textContent = "Running Blender...";
        runHeadlessBtn.disabled = true;

        try {
            const response = await fetch('/run-headless', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    script: currentScript,
                    blenderPath: pathInput.value,
                    saveBlend: saveBlendCheck.checked,
                    render: true
                })
            });

            const result = await response.json();
            if (result.success) {
                logToConsole("Blender Execution Success:\n" + result.output);
                
                // Check if render was actually successful
                const output = result.output || "";
                if (output.includes("RENDER_COMPLETE: True") || output.includes("RENDER_COMPLETE: true")) {
                    logToConsole("Detected successful render. Updating preview...");
                    previewContainer.innerHTML = `<img src="/render_preview.png?t=${Date.now()}" alt="Blender Preview">`;
                    logToConsole("Visual Preview Updated successfully.");
                } else if (output.includes("RENDERING_START")) {
                    logToConsole("Blender started rendering but didn't report completion.", 'error');
                }
            } else {
                logToConsole("Blender Execution Failed:\n" + result.error, 'error');
            }
        } catch (error) {
            logToConsole("Failed to reach server backend.", 'error');
        } finally {
            runHeadlessBtn.textContent = "Run in Headless Blender";
            runHeadlessBtn.disabled = false;
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!currentScript) return;

        const blob = new Blob([currentScript], { type: 'text/x-python' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'blender_object.py';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to start a new project? This will clear all inputs and logs.")) {
            nlInput.value = "";
            dslOutput.textContent = "// DSL output will appear here";
            scriptOutput.textContent = "// Generated script will appear here";
            consoleBox.textContent = "// Blender logs will appear here...";
            previewContainer.innerHTML = '<p class="placeholder-text">Rendered creation will appear here</p>';
            currentScript = "";
            saveSettings();
            location.reload(); // Optional: reload to ensure a clean slate
        }
    });
});
