from pathlib import Path
base = Path("src/main/java/it/butti/motorsport/client")
p = base / "MotorsportCarModel.java"
s = p.read_text()
old = "    private final ModelPart[] wheels;"
assert old in s
s = s.replace(old, old + "\n    private final ModelPart[] frontHubs;")
old = '        wheels = new ModelPart[]{ rubber.getChild("front_left"),rubber.getChild("front_right"),rubber.getChild("rear_left"),rubber.getChild("rear_right")};'
assert old in s
s = s.replace(old, old + '\n        frontHubs = new ModelPart[]{rim.getChild("front_left_hub"),rim.getChild("front_right_hub")};')
hubs = [
('rim.addOrReplaceChild("front_left_hub", CubeListBuilder.create().texOffs(0,0).addBox(-25.2000f, -12.8000f, 21.2800f, .65f, 7.68f, 7.36f), PartPose.ZERO);',
 'rim.addOrReplaceChild("front_left_hub", CubeListBuilder.create().texOffs(0,0).addBox(-5.0400f, -3.8400f, -3.6800f, .65f, 7.68f, 7.36f), PartPose.offset(-20.1600f, -8.9600f, 24.9600f));'),
('rim.addOrReplaceChild("front_right_hub", CubeListBuilder.create().texOffs(0,0).addBox(24.7200f, -12.8000f, 21.2800f, .65f, 7.68f, 7.36f), PartPose.ZERO);',
 'rim.addOrReplaceChild("front_right_hub", CubeListBuilder.create().texOffs(0,0).addBox(4.5600f, -3.8400f, -3.6800f, .65f, 7.68f, 7.36f), PartPose.offset(20.1600f, -8.9600f, 24.9600f));')
]
for before, after in hubs:
    assert s.count(before) == 1
    s = s.replace(before, after)
a = s.index('    public void render(PoseStack stack, MultiBufferSource buffers, int light, float steering, float wheelSpin) {')
b = s.index('        ModelPart[] parts = { body, carbon, accent, rubber, rim };', a)
s = s[:a] + """    public void render(PoseStack stack, MultiBufferSource buffers, int light, float steering) {
        // Positive physics yaw points forward to -X. In the model positive
        // Y rotation points local +Z toward +X; use the inverse sign.
        float frontYaw = -steering * 0.48f;
        for (int i = 0; i < 4; i++) {
            wheels[i].yRot = i < 2 ? frontYaw : 0.0f;
            wheels[i].xRot = 0.0f; // Fixed voxel wheels: no fake spin.
            wheels[i].zRot = 0.0f;
        }
        // Steering wheel hubs must match the tyres, not stay on the body.
        for (ModelPart frontHub : frontHubs) frontHub.yRot = frontYaw;
""" + s[b:]
p.write_text(s)
rpath = base / "MotorsportCarRenderer.java"
r = rpath.read_text()
old = '        state.wheelSpin = (entity.tickCount + tickDelta) * entity.getSpeedBlocksPerTick() * 1.7f;\n'
assert old in r
r = r.replace(old, "")
assert 'model.render(pose,buffers,light,state.steering,state.wheelSpin);' in r
r = r.replace('model.render(pose,buffers,light,state.steering,state.wheelSpin);','model.render(pose,buffers,light,state.steering);')
r = r.replace('        public float wheelSpin;\n','')
rpath.write_text(r)
props=Path("gradle.properties")
assert "mod_version=0.7.0" in props.read_text()
props.write_text(props.read_text().replace("mod_version=0.7.0", "mod_version=0.7.1"))
assert "float frontYaw = -steering * 0.48f;" in p.read_text()
assert "frontHub.yRot = frontYaw;" in p.read_text()
print("PASS wheel orientation and hub pivots; disabled rolling animation; 0.7.1")
