// import modules

// store STATE memory prefix for CREEP STATES to make things easier below
const STATES = Memory.lists.creepStates ;

module.exports = {
    run: function (creepId) {

        // store memory prefix for CREEP STATES to make thins easier below
        const CREEP = Game.getObjectById(creepId);

        switch (CREEP.memory.role) {

            case "harvester":
                this.target_ld_harvester(CREEP);
                break;

            case "carrier":
                this.target_ld_carrier(CREEP);
                break;

            case "upgrader":
                this.target_ld_upgrader(CREEP);
                break;

            case "worker":
                this.target_ld_worker(CREEP);
                break;

            case "remHarvester":
                this.target_ld_harvester(CREEP);
                break;

            case "remCarrier":
                this.target_ld_carrier(CREEP);
                break;

            case "remWorker":
                this.target_ld_worker(CREEP);
                break;
        }
    },

    // HARVESTERS only harvest or TRANSFER to nearby STORAGE.  Some HARVESTERS will
    // have CARRY parts, some will not.  If it has a CARRY, it should check nearby area
    // for DROPPED ENERGY from harvesters without CARRY and TRANSFER to storage
    target_ld_harvester: function (CREEP) {

        // harvesters store assigned SOURCE in sourceId
        CREEP.memory.targetId = CREEP.memory.sourceId ;
        CREEP.memory.targetRoom = CREEP.memory.sourceRoom ;
        CREEP.memory.state = STATES.HARVESTING ;
    },

    // CARRIERS move ENERGY from SOURCE area to EXTENSIONS, SPAWNS and STORAGE.
    // If there is no place to put the ENERGY, TRANSFER to a CREEP or STORAGE, closest
    // to the ROOM CONTROLLER
    target_ld_carrier: function (CREEP) {

        CREEP.memory.targetId = undefined ;

        // room sources are stored base on energy in area, start with richest source first
        for (let s in CREEP.room.memory.sources) {

            let CURRENT_SOURCE = Game.getObjectById(CREEP.room.memory.sources[s].sourceId);

            // look for dropped energy near source
            if (this.target_dropped_energy_in_range_to(CREEP, CURRENT_SOURCE)) {
                // found dropped energy
                break;
            }

            // look for stored energy resources near source
            else if (this.target_resource_storage_in_range_to(CREEP,CURRENT_SOURCE)){
                // found resource storage
                break;
            }
        }

        // failsafe, go stand next to source
        if (CREEP.memory.targetId === undefined) {

            let SOURCE = Game.getObjectById(CREEP.memory.loadId) ;

            let rangeToTarget = CREEP.pos.getRangeTo(SOURCE) ;

            if (rangeToTarget > 3) {

                CREEP.moveTo(SOURCE);
            }
        }
    },

    // WORKERS (builders and upgraders) WITHDRAW or PICKUP ENERGY from STORAGE.
    // If no STRUCTURES to build, then UPGRADE CONTROLLER
    target_ld_worker: function (CREEP) {

        CREEP.memory.targetId = undefined ;

        if (this.target_dropped_energy_in_range_to(CREEP, CREEP)) {}
            // found dropped energy


        else if (this.target_resource_storage_closest_to(CREEP, CREEP)) {}
            // found resource storage


        if (CREEP.memory.targetId === undefined) {

            let CLOSEST_SOURCE = CREEP.pos.findClosestByRange(FIND_SOURCES_ACTIVE) ;

            let rangeToTarget = CREEP.pos.getRangeTo(CLOSEST_SOURCE) ;

            if (rangeToTarget > 3) {

                CREEP.moveTo(CLOSEST_SOURCE);
            }
        }
    },

    target_ld_upgrader: function (CREEP) {

        CREEP.memory.targetId = undefined ;

        if (this.target_link_storage_in_range_to(CREEP,CREEP.room.controller)) {}

        else if (this.target_dropped_energy_in_range_to(CREEP, CREEP.room.controller)) {}

        else if (this.target_resource_storage_in_range_to(CREEP,CREEP.room.controller)) {}
    },

    // DROPPED energy

    target_dropped_energy_closest_to: function (CREEP, SEARCH_POS) {

        let DROPPED_ENERGY = SEARCH_POS.pos.findClosestByPath(FIND_DROPPED_RESOURCES) ;

        if (DROPPED_ENERGY)  {

            if (this.target_dropped_energy_validate(CREEP,DROPPED_ENERGY)) {

                // assign closest ENERGY to memory
                CREEP.memory.targetId = DROPPED_ENERGY.id ;
                CREEP.memory.state = STATES.PICKING_UP ;

                return true
            }
        }

        return false
    },

    target_dropped_energy_in_range_to: function (CREEP, SEARCH_POS) {

        let droppedEnergy = SEARCH_POS.pos.findInRange(
            FIND_DROPPED_RESOURCES, Memory.settings.default_search_radius) ;

        if (droppedEnergy[0]) {

            let CLOSEST_ENERGY = CREEP.pos.findClosestByPath(droppedEnergy);

            if (CLOSEST_ENERGY) {

                // assign closest ENERGY to memory
                CREEP.memory.targetId = CLOSEST_ENERGY.id ;
                CREEP.memory.state = STATES.PICKING_UP ;

                return true
            }
        }
        return false
    },

    // ENERGY based storage

    target_link_storage_in_range_to: function (CREEP, SEARCH_POS) {

        // look for available RESOURCE STORAGE closest to CONTROLLER
        let inRangeStructures = SEARCH_POS.pos.findInRange(FIND_STRUCTURES,
            Memory.settings.default_search_radius,
            {filter: (s) => s.energy > 0
                    && (s.structureType === STRUCTURE_LINK)}
        );

        if (inRangeStructures[0]) {

            let CLOSEST_LINK = SEARCH_POS.pos.findClosestByPath(inRangeStructures) ;

            // if structures found find the closest to the CREEP
            if (CLOSEST_LINK) {

                // assign closest structure to memory
                CREEP.memory.targetId = CLOSEST_LINK.id ;
                CREEP.memory.targetRoom = CLOSEST_LINK.room.name ;
                CREEP.memory.state = STATES.WITHDRAWING ;

                return true
            }
        }
        return false
    },

    // RESOURCE based storage

    target_resource_storage_closest_to: function (CREEP, SEARCH_POS) {

        // look for available RESOURCE STORAGE closest to CONTROLLER
        let CLOSEST_STRUCTURE = SEARCH_POS.pos.findClosestByPath(FIND_STRUCTURES,
            {filter: (s) => _.sum(s.store) > 0
                    && (s.structureType === STRUCTURE_CONTAINER
                    || s.structureType === STRUCTURE_STORAGE)}
        );
        // if structures found find the closest to the CREEP
        if (CLOSEST_STRUCTURE) {

            if (this.target_storage_validate(CREEP, CLOSEST_STRUCTURE)) {

                // assign closest structure to memory
                CREEP.memory.targetId = CLOSEST_STRUCTURE.id ;
                CREEP.memory.state = STATES.WITHDRAWING ;

                return true
            }
        }

        return false
    },

    target_resource_storage_in_range_to: function (CREEP, SEARCH_POS) {

        // look for available RESOURCE STORAGE closest to CONTROLLER
        let structuresInRange = SEARCH_POS.pos.findInRange(FIND_STRUCTURES,
            Memory.settings.default_search_radius,
            {filter: (s) => _.sum(s.store) > 0
                    && (s.structureType === STRUCTURE_CONTAINER
                        || s.structureType === STRUCTURE_STORAGE)}
        );

        if (structuresInRange[0]) {

            // look for available RESOURCE STORAGE closest to CONTROLLER
            let CLOSEST_STRUCTURE = SEARCH_POS.pos.findClosestByPath(structuresInRange);

            // if structures found find the closest to the CREEP
            if (CLOSEST_STRUCTURE) {

                // assign closest structure to memory
                CREEP.memory.targetId = CLOSEST_STRUCTURE.id ;
                CREEP.memory.state = STATES.WITHDRAWING ;

                return true
            }
        }
        return false
    },

    // Validators try to prevent all CREEPs choosing same TARGET
    // ONLY used for CLOSEST_TO targets

    target_dropped_energy_validate: function (CREEP, ENERGY_STRUCTURE) {

        // get available STORAGE capacity
        let energyAvailable = _.sum(ENERGY_STRUCTURE.energy);

        // get number of creeps assigned to Energy target
        let sumAssignedCreeps = _.sum(Game.creeps, (c) => c.memory.targetId === ENERGY_STRUCTURE.id);

        if (sumAssignedCreeps === 0)  {

            return true;
        }

        // if there are ASSIGN CREEPS, sum all the CREEP CARRY CAPACITY
        else {

            let assignedCreeps = CREEP.room.find(FIND_MY_CREEPS,
                {filter: (c) => c.memory.targetId === ENERGY_STRUCTURE.id}
            );

            let totalCreepCapacity = 0 ;

            for (let c in assignedCreeps) {

                let CURRENT_CREEP = assignedCreeps[c];

                totalCreepCapacity = CURRENT_CREEP.carryCapacity - _.sum(CURRENT_CREEP.carry);
            }

            if (totalCreepCapacity >= energyAvailable) {


                return false;
            }
        }
        // default is return GOOD TARGET (true)
        return true;

    },

    target_storage_validate: function (CREEP, RESOURCE_STRUCTURE) {

        // get available STORAGE capacity
        let resourceAvailable = _.sum(RESOURCE_STRUCTURE.store);

        // get number of creeps assigned to Resource target
        let sumAssignedCreeps = _.sum(Game.creeps, (c) => c.memory.targetId === RESOURCE_STRUCTURE.id);

        if (sumAssignedCreeps === 0) {

            return true
        }

        // if there are ASSIGN CREEPS, sum all the CREEP CARRY CAPACITY
        else {

            let assignedCreeps = CREEP.room.find(FIND_MY_CREEPS,
                {filter: (c) => c.memory.targetId === RESOURCE_STRUCTURE.id}
            );

            let totalCreepCapacity = 0;

            for (let c in assignedCreeps) {

                let CURRENT_CREEP = assignedCreeps[c];

                totalCreepCapacity = CURRENT_CREEP.carryCapacity - _.sum(CURRENT_CREEP.carry);
            }

            // if there is not enough available capacity, return BAD TARGET (false)
            if (totalCreepCapacity >= resourceAvailable) {

                return false;
            }
        }
        // default is return GOOD TARGET (true)
        return true;
    },
};