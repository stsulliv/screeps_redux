// import modules

module.exports = {

    run: function (structureId) {

        const STRUCTURE = Game.getObjectById(structureId);

        switch (STRUCTURE.structureType) {

            case STRUCTURE_TOWER:
                this.tower_logic(STRUCTURE);
                break;

            case STRUCTURE_LINK:
                this.link_logic(STRUCTURE);
            break;
        }
    },

    tower_logic: function (TOWER) {

        // set TARGET to closest hostile creep
        let TARGET = TOWER.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        if (TARGET) {
            // ATTACK
            TOWER.attack(TARGET);
        }

        else {

            let REPAIR_TARGET = undefined ;

            // check RAMPARTS and WALLS are at minimum level first
            for (let percentLevel = .1 ; percentLevel < 1.01; percentLevel += .1) {

                let DEFENSE_TO_UPGRADE = TOWER.pos.findClosestByRange(FIND_STRUCTURES,
                    {filter: (s) => (s.structureType === STRUCTURE_WALL
                            || s.structureType === STRUCTURE_RAMPART)
                            && s.hits <= (percentLevel * TOWER.room.memory.settings.wallLevel)});

                if (DEFENSE_TO_UPGRADE) {
                    // set REPAIR TARGET
                    REPAIR_TARGET = DEFENSE_TO_UPGRADE;

                    break ;
                }
            }

            if (REPAIR_TARGET === undefined) {

                // REPAIR remaining damaged structures
                for (let percentHits = .1 ; percentHits <= 1.1; percentHits += .1) {

                    // look for STRUCTURE with damage
                    let DAMAGED_STRUCTURE = TOWER.pos.findClosestByRange(FIND_STRUCTURES,
                        {filter: (s) => s.hits <= (percentHits * s.hitsMax)
                                && s.structureType !== STRUCTURE_WALL
                                && s.structureType !== STRUCTURE_RAMPART});

                    if (DAMAGED_STRUCTURE) {
                        // set REPAIR TARGET
                        REPAIR_TARGET = DAMAGED_STRUCTURE;

                        break ;
                    }
                }
            }

            // changed to false for now.
            if (REPAIR_TARGET === undefined) {

                // if tower are more than 1/2 full upgrade WALLS and RAMPARTS
                if (TOWER.energy >= (.5 * TOWER.energyCapacity)) {

                    // check RAMPARTS and WALLS are at minimum level first
                    for (let hitsLevel = 1000 ; hitsLevel < 1000000; hitsLevel += 500) {

                        let DEFENSE_TO_UPGRADE = TOWER.pos.findClosestByRange(FIND_STRUCTURES,
                            {filter: (s) => (s.structureType === STRUCTURE_WALL
                                    || s.structureType === STRUCTURE_RAMPART)
                                    && (s.hits <= hitsLevel && s.hits < s.hitsMax)});

                        if (DEFENSE_TO_UPGRADE) {
                            // set REPAIR TARGET
                            REPAIR_TARGET = DEFENSE_TO_UPGRADE;

                            break ;
                        }
                    }
                }
            }

            // if REPAIR TARGET has been set, repair/upgrade
            if (REPAIR_TARGET !== undefined) {

                TOWER.repair(REPAIR_TARGET) ;
            }
        }
    },

    link_logic: function (STRUCTURE) {

        if (STRUCTURE) {

            let rangeToController = STRUCTURE.pos.getRangeTo(STRUCTURE.room.controller);

            if (rangeToController < Memory.settings.rangeToControllerStorage) {
                // do nothing, this is the receiving link
            }
            else {

                if (STRUCTURE.energy > 0) {

                    let CLOSEST_CONTROLLER_LINK = STRUCTURE.room.controller.pos.findClosestByRange(FIND_STRUCTURES,
                        {filter: (s) => s.structureType === STRUCTURE_LINK && s.energy < s.energyCapacity });

                    STRUCTURE.transferEnergy(CLOSEST_CONTROLLER_LINK);
                }
            }


        }
    },
};