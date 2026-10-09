from pathlib import Path
p=Path('src/main/java/it/butti/motorsport/client/ClientMotorsport.java')
t=p.read_text()
t=t.replace('import net.minecraft.client.renderer.entity.player.PlayerRenderer;\n','')
t=t.replace('import net.neoforged.neoforge.client.event.RegisterRenderStateModifiersEvent;','import net.neoforged.neoforge.client.event.RenderPlayerEvent;')
a=t.index('        @SubscribeEvent public static void seatedPlayer(RegisterRenderStateModifiersEvent event) {')
b=t.index('\n    }\n\n    @EventBusSubscriber',a)
t=t[:a]+t[b:]
needle='    public static final class GameEvents {\n'
addition='''        @SubscribeEvent public static void seatedPlayer(RenderPlayerEvent.Pre event) {
            Minecraft mc = Minecraft.getInstance();
            if (mc.level == null) return;
            var state = event.getRenderState();
            var entity = mc.level.getEntity(state.id);
            if (!(entity instanceof net.minecraft.world.entity.player.Player player)) return;
            for (MotorsportCarEntity car : mc.level.getEntitiesOfClass(
                MotorsportCarEntity.class, player.getBoundingBox().inflate(8))) {
                if (car.getDriverId().filter(player.getUUID()::equals).isPresent()) {
                    state.isPassenger = true;
                    state.isCrouching = false;
                    break;
                }
            }
        }

'''
assert needle in t
t=t.replace(needle,needle+addition)
p.write_text(t)
