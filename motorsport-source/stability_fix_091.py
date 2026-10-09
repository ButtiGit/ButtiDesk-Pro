from pathlib import Path
import re
base = Path("src/main/java/it/butti/motorsport")
car = base / "entity/MotorsportCarEntity.java"
s = car.read_text()
assert '                placeDriver(serverPlayer);' in s
s = s.replace('                placeDriver(serverPlayer);', '''                Vec3 firstSeat = seatPosition();
                serverPlayer.teleportTo(firstSeat.x, firstSeat.y, firstSeat.z);
                placeDriver(serverPlayer);''')
assert 'return position().add(Math.sin(a) * 0.43, 0.28, -Math.cos(a) * 0.43);' in s
s = s.replace('return position().add(Math.sin(a) * 0.43, 0.28, -Math.cos(a) * 0.43);', 'return position().add(Math.sin(a) * 0.57, 0.35, -Math.cos(a) * 0.57);')
assert 'player.teleportTo(seat.x, seat.y, seat.z);' in s
s = s.replace('player.teleportTo(seat.x, seat.y, seat.z);', 'player.setPos(seat.x, seat.y, seat.z);')
s = s.replace('new double[]{1.45, -1.45}', 'new double[]{1.90, -1.90}')
s = s.replace('new double[]{-1.06, 1.06}', 'new double[]{-1.12, 1.12}')
car.write_text(s)
p=base/"MotorsportMod.java";s=p.read_text();assert 'builder.sized(2.7f, 1.5f)' in s
p.write_text(s.replace('builder.sized(2.7f, 1.5f)', 'builder.sized(3.5f, 1.9f)'))
p=base/"client/MotorsportCarRenderer.java";s=p.read_text();assert 'pose.scale(1, -1, 1);' in s
p.write_text(s.replace('pose.scale(1, -1, 1);', 'pose.scale(1.30f, -1.30f, 1.30f);'))
p=base/"client/ClientMotorsport.java";s=p.read_text()
old='''                    state.isPassenger = true;
                    state.isCrouching = false;
                    break;'''
assert old in s
new='''                    float partial = event.getPartialTick();
                    float yaw = net.minecraft.util.Mth.rotLerp(partial, car.yRotO, car.getYRot());
                    state.bodyRot = yaw;
                    state.yRot = 0.0f;
                    state.xRot = 0.0f;
                    state.isPassenger = true;
                    state.isCrouching = false;
                    state.isUsingItem = false;
                    state.rightArmPose = net.minecraft.client.model.HumanoidModel.ArmPose.EMPTY;
                    state.leftArmPose = net.minecraft.client.model.HumanoidModel.ArmPose.EMPTY;
                    state.walkAnimationPos = 0.0f;
                    state.walkAnimationSpeed = 0.0f;
                    state.attackTime = 0.0f;
                    state.swinging = false;
                    state.pose = net.minecraft.world.entity.Pose.STANDING;
                    double ix = net.minecraft.util.Mth.lerp(partial, car.xo, car.getX());
                    double iy = net.minecraft.util.Mth.lerp(partial, car.yo, car.getY());
                    double iz = net.minecraft.util.Mth.lerp(partial, car.zo, car.getZ());
                    double angle = Math.toRadians(yaw);
                    double px = net.minecraft.util.Mth.lerp(partial, player.xo, player.getX());
                    double py = net.minecraft.util.Mth.lerp(partial, player.yo, player.getY());
                    double pz = net.minecraft.util.Mth.lerp(partial, player.zo, player.getZ());
                    event.getPoseStack().translate(ix + Math.sin(angle)*0.57 - px, iy + 0.35 - py,
                            iz - Math.cos(angle)*0.57 - pz);
                    break;'''
s=s.replace(old,new)
p.write_text(s)
p=Path("gradle.properties");s=p.read_text()
p.write_text(re.sub(r'^mod_version=.*$', 'mod_version=0.9.1', s, flags=re.M))
print("Applied scale, statue render state, seat interpolation, per-tick teleport reduction")
