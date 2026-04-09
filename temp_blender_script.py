import bpy
import os
print('--- BLENDER_COORDINATOR_START ---')
import bpy

# Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# Setup Camera (Distance: 15, Height: 8)
bpy.ops.object.camera_add(location=(15, -15, 8), rotation=(1.1, 0, 0.78))
bpy.context.scene.camera = bpy.context.object

# Setup Lighting (Intensity: 1000)
bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
bpy.ops.object.light_add(type='AREA', location=(-2, -2, 5))
bpy.context.object.data.energy = 1000

# Object 1: tree
bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=2, location=(0, 0, 1))
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.5, location=(0, 0, 2.5))
obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Mat_0")
mat.use_nodes = True
mat.node_tree.nodes.get("Principled BSDF").inputs[0].default_value = (1, 1, 1, 1)
obj.data.materials.append(mat)

# Object 2: sphere
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(3,0,0))
obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Mat_1")
mat.use_nodes = True
mat.node_tree.nodes.get("Principled BSDF").inputs[0].default_value = (1, 1, 1, 1)
obj.data.materials.append(mat)

# Object 3: monkey
bpy.ops.mesh.primitive_monkey_add(location=(6,0,0))
obj = bpy.context.active_object
mat = bpy.data.materials.new(name="Mat_2")
mat.use_nodes = True
mat.node_tree.nodes.get("Principled BSDF").inputs[0].default_value = (1, 1, 1, 1)
obj.data.materials.append(mat)

# Render Settings
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.device = 'CPU'
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.render.resolution_x = 800
bpy.context.scene.render.resolution_y = 600
print("RENDER_START")

# Save Result
bpy.ops.wm.save_as_mainfile(filepath="output_scene.blend")

# Render Preview
print("--- RENDERING_START ---")
# Force Cycles for headless stability
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.render.filepath = os.path.join(os.getcwd(), "render_preview.png")
bpy.ops.render.render(write_still=True)
print(f"--- RENDER_COMPLETE: {os.path.exists('render_preview.png')} ---")
