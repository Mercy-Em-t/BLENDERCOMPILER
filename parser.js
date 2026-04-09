/**
 * Blender Object Compiler - Parser & Generator
 * Handles DSL parsing and bpy script generation.
 */

const BlenderCompiler = {
    // Basic DSL structure: entity(type, attributes)
    // attributes: { color: [r,g,b], size: [x,y,z], ... }

    /**
     * Translates Natural Language to DSL (Mock AI/Rule-based)
     * In a real app, this would call an LLM API.
     */
    /**
     * Translates Natural Language to DSL (Multi-object support)
     */
    async translateToDSL(text) {
        const input = text.toLowerCase();
        // Split by 'and' or commas to find multiple entities
        const parts = input.split(/ and |, /).filter(p => p.trim().length > 0);
        
        const entities = parts.map((part, index) => {
            let type = "cube";
            let color = [1, 1, 1];
            let location = [index * 3, 0, 0]; // Auto-offset to avoid overlap
            
            if (part.includes("sphere") || part.includes("ball")) type = "sphere";
            if (part.includes("cylinder")) type = "cylinder";
            if (part.includes("plane")) type = "plane";
            if (part.includes("tree")) type = "tree";
            if (part.includes("monkey") || part.includes("suzanne")) type = "monkey";
            if (part.includes("cone")) type = "cone";
            if (part.includes("torus") || part.includes("donut")) type = "torus";

            if (part.includes("blue")) color = [0, 0.44, 1];
            if (part.includes("red")) color = [1, 0.2, 0.2];
            if (part.includes("green")) color = [0.2, 0.8, 0.2];
            if (part.includes("yellow")) color = [1, 0.8, 0];
            if (part.includes("purple") || part.includes("pink")) color = [0.8, 0.2, 0.8];
            if (part.includes("orange")) color = [1, 0.5, 0];
            if (part.includes("gold")) color = [1, 0.84, 0];

            // Spatial positioning relative to the first object
            if (part.includes("left")) location[0] -= 2;
            if (part.includes("right")) location[0] += 2;
            if (part.includes("above") || part.includes("top")) location[2] += 2;
            if (part.includes("below") || part.includes("bottom")) location[2] -= 2;

            return `entity("${type}", { color: [${color.join(", ")}], location: [${location.join(", ")}] })`;
        });

        return entities.join("\n");
    },

    /**
     * Converts DSL to Blender Python (bpy) script with cinematic overrides
     */
    generateBpyScript(dsl, options = {}) {
        const camDist = options.camDist || 15;
        const camElev = options.camElev || 8;
        const lightEnergy = options.lightEnergy || 1000;

        try {
            const lines = dsl.split('\n').filter(l => l.trim().length > 0);
            
            let script = `import bpy\n\n`;
            script += `# Reset scene\nbpy.ops.wm.read_factory_settings(use_empty=True)\n\n`;
            
            script += `# Setup Camera (Distance: ${camDist}, Height: ${camElev})\nbpy.ops.object.camera_add(location=(${camDist}, -${camDist}, ${camElev}), rotation=(1.1, 0, 0.78))\nbpy.context.scene.camera = bpy.context.object\n\n`;
            
            script += `# Setup Lighting (Intensity: ${lightEnergy})\nbpy.ops.object.light_add(type='SUN', location=(5, 5, 10))\nbpy.ops.object.light_add(type='AREA', location=(-2, -2, 5))\nbpy.context.object.data.energy = ${lightEnergy}\n\n`;

            lines.forEach((line, i) => {
                const typeMatch = line.match(/entity\("(\w+)"/);
                const type = typeMatch ? typeMatch[1] : "cube";
                const colorMatch = line.match(/color:\s*\[([\d.,\s]+)\]/);
                const color = colorMatch ? colorMatch[1].split(',').map(Number) : [1,1,1];
                const locMatch = line.match(/location:\s*\[([\d.,\s\-]+)\]/);
                const loc = locMatch ? locMatch[1].split(',').map(Number) : [0,0,0];

                script += `# Object ${i+1}: ${type}\n`;
                if (type === "sphere") {
                    script += `bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(${loc}))\n`;
                } else if (type === "cylinder") {
                    script += `bpy.ops.mesh.primitive_cylinder_add(location=(${loc}))\n`;
                } else if (type === "plane") {
                    script += `bpy.ops.mesh.primitive_plane_add(size=10, location=(${loc}))\n`;
                } else if (type === "monkey") {
                    script += `bpy.ops.mesh.primitive_monkey_add(location=(${loc}))\n`;
                } else if (type === "cone") {
                    script += `bpy.ops.mesh.primitive_cone_add(location=(${loc}))\n`;
                } else if (type === "torus") {
                    script += `bpy.ops.mesh.primitive_torus_add(location=(${loc}))\n`;
                } else if (type === "tree") {
                    script += `bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=2, location=(${loc[0]}, ${loc[1]}, ${loc[2] + 1}))\n`;
                    script += `bpy.ops.mesh.primitive_uv_sphere_add(radius=1.5, location=(${loc[0]}, ${loc[1]}, ${loc[2] + 2.5}))\n`;
                } else {
                    script += `bpy.ops.mesh.primitive_cube_add(size=2, location=(${loc}))\n`;
                }

                script += `obj = bpy.context.active_object\n`;
                script += `mat = bpy.data.materials.new(name="Mat_${i}")\n`;
                script += `mat.use_nodes = True\n`;
                script += `mat.node_tree.nodes.get("Principled BSDF").inputs[0].default_value = (${color[0]}, ${color[1]}, ${color[2]}, 1)\n`;
                script += `obj.data.materials.append(mat)\n\n`;
            });

            script += `# Render Settings\nbpy.context.scene.render.engine = 'CYCLES'\nbpy.context.scene.cycles.device = 'CPU'\nbpy.context.scene.render.image_settings.file_format = 'PNG'\nbpy.context.scene.render.resolution_x = 800\nbpy.context.scene.render.resolution_y = 600\nprint("RENDER_START")\n`;
            
            return script;
        } catch (e) {
            return `# Error: ${e.message}`;
        }
    }
};

window.BlenderCompiler = BlenderCompiler;
