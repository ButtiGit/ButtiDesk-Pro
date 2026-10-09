from pathlib import Path
import re
b=Path('src/main/java/it/butti/motorsport')
car=b/'entity/MotorsportCarEntity.java'
s=car.read_text()
anchor='    private static final EntityDataAccessor<Optional<UUID>> DRIVER ='
assert s.count(anchor)==1
s=s.replace(anchor,'''    // Shared cockpit coordinates, in blocks from the chassis pivot.
    public static final double SEAT_REAR = 0.48;
    public static final double SEAT_HEIGHT = 0.32;

'''+anchor)
old='return position().add(Math.sin(a) * 0.34, 0.32, -Math.cos(a) * 0.34);'
assert s.count(old)==1
s=s.replace(old,'return position().add(Math.sin(a) * SEAT_REAR, SEAT_HEIGHT, -Math.cos(a) * SEAT_REAR);')
assert 'new double[]{1.90, -1.90}' in s
assert 'new double[]{-1.12, 1.12}' in s
s=s.replace('new double[]{1.90, -1.90}','new double[]{2.60, -2.48}')
s=s.replace('new double[]{-1.12, 1.12}','new double[]{-1.34, 1.34}')
car.write_text(s)
c=b/'client/ClientMotorsport.java'
s=c.read_text()
old='''                    event.getPoseStack().translate(ix + Math.sin(angle)*0.34 - px,
                            iy + 0.32 - py - 0.55,
                            iz - Math.cos(angle)*0.34 - pz);'''
new='''                    event.getPoseStack().translate(ix + Math.sin(angle)*MotorsportCarEntity.SEAT_REAR - px,
                            iy + MotorsportCarEntity.SEAT_HEIGHT - py - 0.72,
                            iz - Math.cos(angle)*MotorsportCarEntity.SEAT_REAR - pz);'''
assert s.count(old)==1
s=s.replace(old,new)
c.write_text(s)
p=b/'client/MotorsportCarRenderer.java'
s=p.read_text()
assert 'pose.scale(1.30f, -1.30f, 1.30f);' in s
p.write_text(s.replace('pose.scale(1.30f, -1.30f, 1.30f);','pose.scale(1.60f, -1.60f, 1.60f);'))
p=b/'MotorsportMod.java'
s=p.read_text()
assert 'builder.sized(3.5f, 1.9f)' in s
p.write_text(s.replace('builder.sized(3.5f, 1.9f)','builder.sized(3.8f, 2.2f)'))
p=Path('gradle.properties')
s=p.read_text()
assert 'mod_version=0.9.2' in s
p.write_text(s.replace('mod_version=0.9.2','mod_version=0.9.3'))
print('PASS: model scale 1.6 and cockpit seat shared, 0.72 render drop, collider/tyres adjusted')
