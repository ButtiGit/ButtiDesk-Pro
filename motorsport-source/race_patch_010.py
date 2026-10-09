from pathlib import Path
import re
root=Path('src/main/java/it/butti/motorsport')
src=Path('motorsport-source/MotorsportRace.java')
assert src.exists()
dst=root/'race/MotorsportRace.java'
dst.parent.mkdir(exist_ok=True)
dst.write_text(src.read_text())

p=root/'entity/MotorsportCarEntity.java'
s=p.read_text()
anchor='    private int inputAge = 999;'
assert s.count(anchor)==1
s=s.replace(anchor,anchor+'''
    // Server-controlled autonomous car state. AI never impersonates a driver.
    private boolean raceAi;
    private boolean raceActive;
    private double raceTargetX;
    private double raceTargetZ;
    private double raceSpeedLimit = 0.38;
''')
anchor='    @Override public InteractionResult interact(net.minecraft.world.entity.player.Player player, InteractionHand hand) {'
assert s.count(anchor)==1
s=s.replace(anchor,anchor+'''
        if (raceAi) return InteractionResult.PASS; // AI car cannot be stolen.
''')
anchor='    public void acceptInput(ServerPlayer player, int validatedBits) {'
assert s.count(anchor)==1
s=s.replace(anchor,'''    public void setRaceAI(boolean enabled) {
        this.raceAi = enabled;
        this.raceActive = false;
    }

    public void setRaceTarget(double x, double z, double speedLimit) {
        if (!raceAi) return;
        this.raceActive = true;
        this.raceTargetX = x;
        this.raceTargetZ = z;
        this.raceSpeedLimit = speedLimit;
    }

    public void stopRaceAI() {
        this.raceActive = false;
    }

'''+anchor)
old='''        motion = DriveDynamics.integrate(motion, new DriveDynamics.Input(w, s, a, d), grip);
        setYRot((float)motion.yawDegrees());'''
new='''        if (raceAi) {
            if (raceActive) {
                double dx = raceTargetX - getX();
                double dz = raceTargetZ - getZ();
                double targetYaw = Math.toDegrees(Math.atan2(-dx, dz));
                double error = net.minecraft.util.Mth.wrapDegrees((float)(targetYaw - motion.yawDegrees()));
                double turn = net.minecraft.util.Mth.clamp(error, -4.7, 4.7);
                double v = Math.min(raceSpeedLimit, Math.max(0, motion.speed()) + 0.016);
                motion = new DriveDynamics.State(v, motion.yawDegrees() + turn, 0);
                entityData.set(STEERING, (float)Math.signum(turn));
            } else {
                motion = new DriveDynamics.State(0, motion.yawDegrees(), 0);
                entityData.set(STEERING, 0.0f);
            }
        } else {
            motion = DriveDynamics.integrate(motion, new DriveDynamics.Input(w, s, a, d), grip);
            entityData.set(STEERING, (float)((d ? 1 : 0) - (a ? 1 : 0)));
        }
        setYRot((float)motion.yawDegrees());'''
assert s.count(old)==1
s=s.replace(old,new)
old='''        setDeltaMovement(new Vec3(0, verticalCollision ? 0 : desired.y, 0));
        Vec3 travelled = position().subtract(before);'''
new='''        Vec3 travelled = position().subtract(before);
        // Horizontal motion now reaches the client for render interpolation.
        // Previous versions always sent (0,dy,0) even while accelerating.
        setDeltaMovement(new Vec3(travelled.x, verticalCollision ? 0 : desired.y, travelled.z));'''
assert s.count(old)==1
s=s.replace(old,new)
old='''        entityData.set(STEERING, (float)((d ? 1 : 0) - (a ? 1 : 0)));
        anchorOwner();'''
assert s.count(old)==1
s=s.replace(old,'''        anchorOwner();''')
p.write_text(s)

p=root/'MotorsportMod.java';s=p.read_text()
assert '.updateInterval(1)' in s
s=s.replace('.updateInterval(1)', '.updateInterval(2)')
p.write_text(s)
p=Path('gradle.properties');s=p.read_text()
assert 'mod_version=0.9.3' in s
p.write_text(s.replace('mod_version=0.9.3','mod_version=0.10.0'))
print('RACE PATCH OK: AI movement, six-car race, actual motion sync, NeoForge sources')
