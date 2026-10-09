from pathlib import Path
import re
root=Path("src/main/java/it/butti/motorsport")
car=root/"entity/MotorsportCarEntity.java"
s=car.read_text()
old="Math.sin(a) * 0.57, 0.35, -Math.cos(a) * 0.57"
assert s.count(old)==1, "Missing old seat position"
s=s.replace(old,"Math.sin(a) * 0.34, 0.32, -Math.cos(a) * 0.34")
car.write_text(s)
client=root/"client/ClientMotorsport.java"
s=client.read_text()
old='''                    double seatX = ix + Math.sin(angle) * 0.57;
                    double seatY = iy + 0.35;
                    double seatZ = iz - Math.cos(angle) * 0.57;'''
new='''                    double seatX = ix + Math.sin(angle) * 0.34;
                    double seatY = iy + 0.32;
                    double seatZ = iz - Math.cos(angle) * 0.34;'''
assert s.count(old)==1
s=s.replace(old,new)
old='event.getPoseStack().translate(seatX - px, seatY - py, seatZ - pz);'
assert s.count(old)==1
s=s.replace(old,'event.getPoseStack().translate(seatX - px, seatY - py - 0.55, seatZ - pz);')
client.write_text(s)
p=Path("gradle.properties")
v=p.read_text()
assert "mod_version=0.9.1" in v
p.write_text(v.replace("mod_version=0.9.1","mod_version=0.9.2"))
print("Applied cockpit position 0.34 / 0.32 + render pelvis drop 0.55")
