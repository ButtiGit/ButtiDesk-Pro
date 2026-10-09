package it.butti.motorsport.race;

import com.mojang.brigadier.arguments.IntegerArgumentType;
import it.butti.motorsport.MotorsportMod;
import it.butti.motorsport.entity.MotorsportCarEntity;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.commands.arguments.EntityArgument;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.level.GameType;
import net.minecraft.world.level.block.Blocks;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.RegisterCommandsEvent;
import net.neoforged.neoforge.event.tick.ServerTickEvent;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * An actual playable first race: generated asphalt oval, six grid cars,
 * five autonomous drivers, a player cockpit, countdown, positions and laps.
 * Server-authoritative: no client can spoof an opponent's steering.
 */
@EventBusSubscriber(modid = MotorsportMod.MOD_ID)
public final class MotorsportRace {
    private static final int LAPS = 3;
    private static final double RX = 48.0;
    private static final double RZ = 31.0;
    private static Race race;
    private MotorsportRace() {}

    private static final class Entry {
        final MotorsportCarEntity car;
        final String label;
        final boolean ai;
        final double lane;
        double previousTheta;
        double distance;
        boolean finished;
        int finishTick = -1;

        Entry(MotorsportCarEntity car, String label, boolean ai, double lane, double theta) {
            this.car = car;
            this.label = label;
            this.ai = ai;
            this.lane = lane;
            this.previousTheta = normalize(theta);
        }
        int completedLaps() { return Math.min(LAPS, (int)(distance / (Math.PI * 2))); }
    }

    private static final class Race {
        final ServerLevel level;
        final int cx, cy, cz;
        final List<Entry> entries = new ArrayList<>();
        final Map<UUID, GameType> cameraModes = new HashMap<>();
        int countdown = -1;
        int tickCount;
        boolean running;
        boolean completed;
        Race(ServerLevel level, int cx, int cy, int cz) {
            this.level = level;
            this.cx = cx;
            this.cy = cy;
            this.cz = cz;
        }
    }

    @SubscribeEvent
    public static void registerCommands(RegisterCommandsEvent event) {
        event.getDispatcher().register(
            Commands.literal("motorsport")
                .then(Commands.literal("help").executes(c -> help(c.getSource())))
                .then(Commands.literal("setup").requires(s -> s.hasPermission(2))
                    .executes(c -> setup(c.getSource())))
                .then(Commands.literal("start").requires(s -> s.hasPermission(2))
                    .executes(c -> start(c.getSource())))
                .then(Commands.literal("reset").requires(s -> s.hasPermission(2))
                    .executes(c -> reset(c.getSource())))
                .then(Commands.literal("standings").executes(c -> standings(c.getSource())))
                .then(Commands.literal("watch")
                    .then(Commands.argument("car", IntegerArgumentType.integer(1, 6))
                        .executes(c -> watch(c.getSource(), IntegerArgumentType.getInteger(c, "car")))))
                .then(Commands.literal("freecam").executes(c -> freecam(c.getSource())))
        );
    }

    private static int help(CommandSourceStack src) {
        message(src, "SETUP: /motorsport setup | DRIVE: right-click car #1 | START: /motorsport start");
        message(src, "WATCH: /motorsport watch 2..6 | FREECAM: /motorsport freecam");
        message(src, "STANDINGS: /motorsport standings | RESET: /motorsport reset");
        return 1;
    }

    private static void message(CommandSourceStack src, String text) {
        src.sendSuccess(() -> Component.literal("[Motorsport] " + text), false);
    }

    private static int setup(CommandSourceStack src) throws com.mojang.brigadier.exceptions.CommandSyntaxException {
        ServerPlayer owner = src.getPlayerOrException();
        clearRace();
        int cx = owner.blockPosition().getX();
        int cy = owner.blockPosition().getY();
        int cz = owner.blockPosition().getZ();
        ServerLevel level = owner.serverLevel();
        Race r = new Race(level, cx, cy, cz);
        race = r;
        // Make the tarmac in the current empty area, on ground level.
        // WARNING: this intentionally overwrites terrain in the test world.
        int rx = (int)RX + 9, rz = (int)RZ + 9;
        for (int ix = -rx; ix <= rx; ix++) {
            for (int iz = -rz; iz <= rz; iz++) {
                double normalized = Math.sqrt((ix*ix)/(RX*RX) + (iz*iz)/(RZ*RZ));
                double edge = Math.abs(normalized - 1.0) * RZ;
                if (edge > 6.0) continue;
                BlockPos pos = new BlockPos(cx + ix, cy - 1, cz + iz);
                boolean finish = ix > RX - 7 && Math.abs(iz) <= 2;
                boolean curb = edge > 4.9;
                level.setBlockAndUpdate(pos,
                    finish ? (((ix+iz)&1)==0 ? Blocks.WHITE_CONCRETE : Blocks.BLACK_CONCRETE).defaultBlockState()
                           : curb ? (((ix/2+iz/2)&1)==0 ? Blocks.RED_CONCRETE : Blocks.WHITE_CONCRETE).defaultBlockState()
                                  : Blocks.GRAY_CONCRETE.defaultBlockState());
            }
        }

        for (int i = 0; i < 6; i++) {
            int row = i / 2;
            double theta = -row * 0.31;
            double lane = (i % 2 == 0) ? -1.7 : 1.7;
            double x = cx + (RX + lane) * Math.cos(theta);
            double z = cz + (RZ + lane) * Math.sin(theta);
            MotorsportCarEntity car = new MotorsportCarEntity(MotorsportMod.CAR.get(), level);
            car.setPos(x, cy + 0.13, z);
            double dx = -(RX+lane) * Math.sin(theta);
            double dz = (RZ+lane) * Math.cos(theta);
            car.setYRot((float)Math.toDegrees(Math.atan2(-dx, dz)));
            boolean ai = i != 0;
            String label = ai ? "AI-" + i : "PLAYER";
            car.setCustomName(Component.literal("#" + (i+1) + " " + label));
            car.setCustomNameVisible(true);
            car.setRaceAI(ai);
            level.addFreshEntity(car);
            r.entries.add(new Entry(car, label, ai, lane, theta));
        }
        message(src, "Oval created: six cars, 5 AI, 3 laps. Enter car #1 and run /motorsport start.");
        message(src, "For TV mode use /motorsport watch 2 and then /motorsport start.");
        return 1;
    }

    private static int start(CommandSourceStack src) {
        Race r = race;
        if (r == null || r.completed) {
            message(src, "First use /motorsport setup.");
            return 0;
        }
        if (r.running || r.countdown >= 0) {
            message(src, "Race already active.");
            return 0;
        }
        r.countdown = 60;
        r.tickCount = 0;
        broadcast(r, "3... 2... 1...");
        return 1;
    }

    private static int standings(CommandSourceStack src) {
        Race r = race;
        if (r == null) { message(src, "No race: /motorsport setup"); return 0; }
        message(src, "CLASSIFICATION - 3 laps:");
        List<Entry> sorted = new ArrayList<>(r.entries);
        sorted.sort(Comparator.comparingDouble((Entry e) -> e.distance).reversed());
        int p=1;
        for (Entry e : sorted) {
            message(src, p++ + ". " + e.label + "  " + (e.finished ? "FINISHED" :
                "Lap " + (e.completedLaps() + 1) + "/" + LAPS) +
                "  " + (int)(e.distance * 100 / (2*Math.PI*LAPS)) + "%");
        }
        return 1;
    }

    private static int watch(CommandSourceStack src, int index) throws com.mojang.brigadier.exceptions.CommandSyntaxException {
        ServerPlayer player = src.getPlayerOrException();
        Race r = race;
        if (r == null || r.level != player.serverLevel()) {
            message(src, "No race in this world. /motorsport setup"); return 0;
        }
        // Driving and watching are mutually exclusive: release the seat first.
        for (Entry e : r.entries) if (e.car.isDriver(player)) e.car.stopDriving(player);
        r.cameraModes.putIfAbsent(player.getUUID(), player.gameMode.getGameModeForPlayer());
        player.setGameMode(GameType.SPECTATOR);
        player.setCamera(r.entries.get(index - 1).car);
        message(src, "TV camera following car #" + index + ". /motorsport freecam to leave.");
        return 1;
    }

    private static int freecam(CommandSourceStack src) throws com.mojang.brigadier.exceptions.CommandSyntaxException {
        ServerPlayer player = src.getPlayerOrException();
        player.setCamera(player);
        if (race != null) {
            GameType prior = race.cameraModes.remove(player.getUUID());
            if (prior != null) player.setGameMode(prior);
        }
        return 1;
    }

    private static int reset(CommandSourceStack src) {
        clearRace();
        message(src, "Race reset. Tarmac stays in the world; /motorsport setup creates a new grid.");
        return 1;
    }

    private static void clearRace() {
        Race r = race;
        if (r == null) return;
        for (ServerPlayer player : r.level.getServer().getPlayerList().getPlayers()) {
            GameType prior = r.cameraModes.get(player.getUUID());
            if (prior != null) {
                player.setCamera(player);
                player.setGameMode(prior);
            }
            for (Entry e : r.entries) if (e.car.isDriver(player)) e.car.stopDriving(player);
        }
        for (Entry e : r.entries) if (!e.car.isRemoved()) e.car.discard();
        race = null;
    }

    private static double normalize(double angle) {
        double a = angle % (2*Math.PI);
        return a < 0 ? a + 2*Math.PI : a;
    }

    @SubscribeEvent
    public static void tick(ServerTickEvent.Post event) {
        Race r = race;
        if (r == null) return;
        if (r.level.getServer() != event.getServer()) { race = null; return; }
        if (r.countdown > 0) {
            r.countdown--;
            if (r.countdown % 20 == 0 && r.countdown > 0) broadcast(r, "" + (r.countdown/20) + "...");
            if (r.countdown == 0) { r.running=true; broadcast(r,"LIGHTS OUT! GO GO GO!"); }
        }
        if (!r.running || r.completed) return;
        r.tickCount++;

        for (Entry entry : r.entries) {
            if (entry.car.isRemoved() || entry.finished) continue;
            double x = entry.car.getX() - r.cx, z = entry.car.getZ() - r.cz;
            double theta = normalize(Math.atan2(z / (RZ+entry.lane), x / (RX+entry.lane)));
            double delta = theta - entry.previousTheta;
            if (delta < -Math.PI) delta += Math.PI*2;
            if (delta > Math.PI) delta -= Math.PI*2;
            // Reject large position jumps; count only forward progress.
            if (delta > 0 && delta < 0.24) entry.distance += delta;
            entry.previousTheta = theta;
            if (entry.distance >= 2*Math.PI*LAPS) {
                entry.finished = true;
                entry.finishTick = r.tickCount;
                entry.car.stopRaceAI();
                broadcast(r, entry.label + " FINISHED!");
                continue;
            }
            if (entry.ai) {
                double ahead = theta + 0.22;
                double tx = r.cx + (RX+entry.lane) * Math.cos(ahead);
                double tz = r.cz + (RZ+entry.lane) * Math.sin(ahead);
                double targetSpeed = 0.36 + ((r.entries.indexOf(entry) * 7) % 5) * 0.017;
                entry.car.setRaceTarget(tx,tz,targetSpeed);
            }
        }

        if (r.tickCount % 20 == 0) {
            List<Entry> sorted = new ArrayList<>(r.entries);
            sorted.sort(Comparator.comparingDouble((Entry e) -> e.distance).reversed());
            Entry leader = sorted.get(0);
            String hud = "F1 VOXEL | " + (r.tickCount/20) + "s | Leader: " + leader.label +
                " | Lap " + Math.min(LAPS, leader.completedLaps()+1) + "/" + LAPS;
            for (ServerPlayer player : event.getServer().getPlayerList().getPlayers())
                if (player.level() == r.level) player.displayClientMessage(Component.literal(hud), true);
        }
        if (r.entries.stream().filter(e -> e.ai).allMatch(e -> e.finished)) {
            r.completed = true;
            r.running = false;
            broadcast(r,"CHECKERED FLAG! /motorsport standings");
        }
    }

    private static void broadcast(Race r, String text) {
        for (ServerPlayer p : r.level.getServer().getPlayerList().getPlayers())
            if (p.level() == r.level) p.sendSystemMessage(Component.literal("[Motorsport] " + text));
    }
}
