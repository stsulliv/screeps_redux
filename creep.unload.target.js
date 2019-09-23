// import modules

// store STATE memory prefix for CREEP STATES to make things easier below
const STATES = Memory.lists.creepStates ;

module.exports = {
    run: function (creepId) {

        // store memory prefix for CREEP STATES to make thins easier below
        const CREEP = Game.getObjectById(creepId);

        switch (CREEP.memory.role) {

            case "harvester":
                this.target_unload_harvester(CREEP, STATES);
                break;

            case "carrier":
                this.target_unload_carrier(CREEP, STATES);
                break;

            case "upgrader":
                this.target_unload_upgrader(CREEP, STATES);
                break;

            case "worker":
                this.target_unload_worker(CREEP, STATES);
                break;

            case "remHarvester":
                this.target_unload_harvester(CREEP, STATES);
                break;

            case "remCarrier":
                this.target_unload_carrier(CREEP, STATES);
                break;

            case "remWorker":
                this.target_unload_worker(CREEP, STATES);
                break;
        }
    },

    // TARGET profile by role

    target_unload_harvester: function (CREEP) {

        // carriers store their assigned SOURCE.id in homeId
        let SOURCE = Game.getObjectById(CREEP.memory.sourceId) ;

        // clear targetID
        CREEP.memory.targetId = undefined ;

        if (this.target_energy_storage_in_range_to(CREEP, SOURCE)) {}
            // found Energy storage in range

        else if (this.target_tower_storage_in_range_to(CREEP, SOURCE)) {}
            // found TOWER storage

        else if (this.target_resource_storage_in_range_to(CREEP, SOURCE)){}
            // found Resource storage in range

        // if no storage available, drop energy
        else {
            CREEP.drop(RESOURCE_ENERGY);
            CREEP.memory.state = STATES.TARGETING_LD ;
            CREEP.memory.targetId = undefined ;
            CREEP.memory.targetRoom = undefined ;
        }
    },

    target_unload_carrier: function (CREEP) {

        CREEP.memory.targetId = undefined ;

        let UNLOAD_TARGET = Game.getObjectById(CREEP.memory.unloadId) ;

        if (this.target_link_storage_in_range_to(CREEP, CREEP)) {}
        //found close Link

        else if (this.target_energy_storage_closest_to(CREEP, CREEP)) {}
        //found Energy storage

        else if (this.target_tower_storage_in_range_to(CREEP, CREEP)) {}
        //found Tower storage

        else if (this.target_resource_storage_closest_to(CREEP, UNLOAD_TARGET)) {}
            // found close resource storage

        // Failsafe is DROP in range of controller
        else {

            let rangeToController = CREEP.pos.getRangeTo(CREEP.room.controller) ;

            if (rangeToController > Memory.settings.default_search_radius) {

                CREEP.moveTo(CREEP.room.controller);
            }
            else {
                CREEP.drop(RESOURCE_ENERGY);
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                CREEP.memory.state = STATES.TARGETING_LD ;
            }
        }
    },

    target_unload_upgrader: function (CREEP) {

        CREEP.memory.targetId = undefined ;

        // since the upgrader should be close to the storage, i use uit to transfer from link
        let closeLinks = CREEP.pos.findInRange(FIND_STRUCTURES, Memory.settings.default_search_radius,
            {filter: (s) => s.structureType === STRUCTURE_LINK && s.energy > 0});

        // keep transferring to storage as long as link has energy
        if (closeLinks[0]) {

           this.target_resource_storage_closest_to(CREEP, CREEP)

        }

        if (CREEP.memory.targetId === undefined) {

            let CONTROLLER = Game.getObjectById(CREEP.memory.controllerId) ;

            CREEP.memory.targetId = CONTROLLER.id ;
            CREEP.memory.targetRoom = CONTROLLER.room.name ;
            CREEP.memory.state = STATES.UPGRADING ;
        }
    },

    target_unload_worker: function (CREEP) {

        CREEP.memory.targetId = undefined ;

        // add to try and keep builders building versus stopping after one, because Spawn/Extensions empty
        if (this.target_build_structure_in_range_to(CREEP)) {}
            // found nearby build target

        // if close to a  non-full SPAWN or EXTENSION, transfer energy.
        else if (this.target_energy_storage_in_range_to(CREEP, CREEP)) {}
            //found Energy storage

        else if (this.target_tower_storage_closest_to(CREEP, CREEP)) {}
        //found Energy storage

        else if (this.target_build_structure(CREEP)) {}
            // found build target

        // if all is good, upgrade the controller.
        else {
            CREEP.memory.targetId = CREEP.room.controller.id ;
            CREEP.memory.targetRoom = CREEP.room.name ;
            CREEP.memory.state = STATES.UPGRADING ;
        }
    },

    // RESOURCE storage

    target_resource_storage_closest_to: function (CREEP, SEARCH_POS) {

        // look for available RESOURCE STORAGE closest to CONTROLLER
        let allNonFullStorage = SEARCH_POS.room.find(FIND_STRUCTURES,
            {filter: (s) => _.sum(s.store) < s.storeCapacity
                    && (s.structureType === STRUCTURE_CONTAINER
                        || s.structureType === STRUCTURE_STORAGE)}
        );

        let numStorageFound = allNonFullStorage.length ;

        for (let i = 0; i < numStorageFound; i++) {

            // look for available RESOURCE STORAGE closest to CONTROLLER
            let CLOSEST_STRUCTURE = SEARCH_POS.pos.findClosestByPath(allNonFullStorage);

            // if structures found find the closest to the CREEP
            if (CLOSEST_STRUCTURE) {

                if (this.target_energy_validate(CREEP, CLOSEST_STRUCTURE)) {

                    // if validated, assign closest structure to memory
                    CREEP.memory.targetId = CLOSEST_STRUCTURE.id ;
                    CREEP.memory.targetRoom = CLOSEST_STRUCTURE.room.name ;
                    CREEP.memory.state = STATES.TRANSFERRING ;

                    return true
                }
                else {

                    // remove the CLOSEST_STRUCTURE from ARRAY before running again
                    for (let s in allNonFullStorage) {

                        if (allNonFullStorage[s] === CLOSEST_STRUCTURE) {
                            // if the CURRENT SOURCE is the CLOSEST SOURCE, remove it from array
                            allNonFullStorage.splice(s, 1) ;
                            break;
                        }
                    }

                }
            }

        }
        return false
    },

    target_resource_storage_in_range_to: function (CREEP, SEARCH_POS) {

        let allNonFullStorage = SEARCH_POS.pos.findInRange(FIND_STRUCTURES, Memory.settings.default_search_radius,
            {filter: (s) => _.sum(s.store) < s.storeCapacity
                    && (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE)}
        );

        if (allNonFullStorage[0]) {

            // look for available RESOURCE STORAGE closest to CONTROLLER
            let CLOSEST_STRUCTURE = SEARCH_POS.pos.findClosestByPath(allNonFullStorage);

            // if structures found find the closest to the CREEP
            if (CLOSEST_STRUCTURE) {

                // if validated, assign closest structure to memory
                CREEP.memory.targetId = CLOSEST_STRUCTURE.id ;
                CREEP.memory.targetRoom = CLOSEST_STRUCTURE.room.name ;
                CREEP.memory.state = STATES.TRANSFERRING ;

                return true
            }
        }
        return false
    },

    // ENERGY storage

    target_energy_storage_closest_to: function (CREEP, SEARCH_POS) {

        let allNonFullStorage = SEARCH_POS.room.find(FIND_STRUCTURES,
            {filter: (s) => s.energy < s.energyCapacity
                    && (s.structureType === STRUCTURE_EXTENSION
                        || s.structureType === STRUCTURE_SPAWN)}
        );

        let numStorageFound = allNonFullStorage.length  ;

        for (let i = 0; i < numStorageFound; i++) {


            // look for available RESOURCE STORAGE closest to CONTROLLER
            let CLOSEST_STRUCTURE = SEARCH_POS.pos.findClosestByPath(allNonFullStorage);

            // if structures found find the closest to the CREEP
            if (CLOSEST_STRUCTURE) {

                if (this.target_energy_validate(CREEP, CLOSEST_STRUCTURE)) {

                    // if validated, assign closest structure to memory
                    CREEP.memory.targetId = CLOSEST_STRUCTURE.id ;
                    CREEP.memory.targetRoom = CLOSEST_STRUCTURE.room.name ;
                    CREEP.memory.state = STATES.TRANSFERRING ;

                    return true
                }
                else {

                    // remove the CLOSEST_STRUCTURE from ARRAY before running again
                    for (let s in allNonFullStorage) {

                        if (allNonFullStorage[s] === CLOSEST_STRUCTURE) {
                            // if the CURRENT SOURCE is the CLOSEST SOURCE, remove it from array
                            allNonFullStorage.splice(s, 1) ;
                            break;
                        }
                    }
                }
            }
        }
        return false
    },

    target_energy_storage_in_range_to: function (CREEP, SEARCH_POS) {

        let allNonFullStorage = SEARCH_POS.pos.findInRange(FIND_STRUCTURES, Memory.settings.default_search_radius,
            {filter: (s) => s.energy < s.energyCapacity
                    && (s.structureType === STRUCTURE_EXTENSION
                        || s.structureType === STRUCTURE_SPAWN)}
        );

        if (allNonFullStorage[0]) {

            // look for available RESOURCE STORAGE closest to CONTROLLER
            let CLOSEST_STRUCTURE = SEARCH_POS.pos.findClosestByPath(allNonFullStorage);

            // if structures found find the closest to the CREEP
            if (CLOSEST_STRUCTURE) {

                // if validated, assign closest structure to memory
                CREEP.memory.targetId = CLOSEST_STRUCTURE.id ;
                CREEP.memory.targetRoom = CLOSEST_STRUCTURE.room.name ;
                CREEP.memory.state = STATES.TRANSFERRING ;

                return true
            }

        }
        return false
    },

    target_tower_storage_closest_to: function (CREEP, SEARCH_POS) {

        // look for available RESOURCE STORAGE closest to CONTROLLER

        let allNonFullStorage = SEARCH_POS.room.find(FIND_STRUCTURES,
            {filter: (s) => s.energy < (.75 * s.energyCapacity)
                    && (s.structureType === STRUCTURE_TOWER)}
        );

        let numStorageFound = allNonFullStorage.length ;

        for (let i = 0; i < numStorageFound; i++) {

            // look for available RESOURCE STORAGE closest to CONTROLLER
            let CLOSEST_STRUCTURE = SEARCH_POS.pos.findClosestByPath(allNonFullStorage);

            // if structures found find the closest to the CREEP
            if (CLOSEST_STRUCTURE) {

                if (this.target_energy_validate(CREEP, CLOSEST_STRUCTURE)) {

                    // if validated, assign closest structure to memory
                    CREEP.memory.targetId = CLOSEST_STRUCTURE.id ;
                    CREEP.memory.targetRoom = CLOSEST_STRUCTURE.room.name ;
                    CREEP.memory.state = STATES.TRANSFERRING ;

                    return true
                }
                else {

                    // remove the CLOSEST_STRUCTURE from ARRAY before running again
                    for (let s in allNonFullStorage) {

                        if (allNonFullStorage[s] === CLOSEST_STRUCTURE) {
                            // if the CURRENT SOURCE is the CLOSEST SOURCE, remove it from array
                            allNonFullStorage.splice(s, 1) ;
                            break;
                        }
                    }
                }
            }
        }
        return false
    },

    target_tower_storage_in_range_to: function (CREEP, SEARCH_POS) {

        let allNonFullStorage = SEARCH_POS.pos.findInRange(FIND_STRUCTURES, Memory.settings.default_search_radius,
            {filter: (s) => s.energy < (.75 * s.energyCapacity)
                    && (s.structureType === STRUCTURE_TOWER)}
        );

        if (allNonFullStorage[0]) {

            // look for available RESOURCE STORAGE closest to CONTROLLER
            let CLOSEST_STRUCTURE = SEARCH_POS.pos.findClosestByPath(allNonFullStorage);

            // if structures found find the closest to the CREEP
            if (CLOSEST_STRUCTURE) {

                // if validated, assign closest structure to memory
                CREEP.memory.targetId = CLOSEST_STRUCTURE.id ;
                CREEP.memory.targetRoom = CLOSEST_STRUCTURE.room.name ;
                CREEP.memory.state = STATES.TRANSFERRING ;

                return true
            }
        }
        return false
    },

    target_link_storage_in_range_to: function (CREEP, SEARCH_POS) {

        // look for available RESOURCE STORAGE closest to CONTROLLER
        let inRangeStructures = SEARCH_POS.pos.findInRange(FIND_STRUCTURES,
            Memory.settings.default_search_radius,
            {filter: (s) => s.energy < s.energyCapacity
                    && (s.structureType === STRUCTURE_LINK)}
        );

        let CLOSEST_LINK = SEARCH_POS.pos.findClosestByPath(inRangeStructures) ;

        // if structures found find the closest to the CREEP
        if (CLOSEST_LINK) {

            // assign closest structure to memory
            CREEP.memory.targetId = CLOSEST_LINK.id ;
            CREEP.memory.targetRoom = CLOSEST_LINK.room.name ;
            CREEP.memory.state = STATES.TRANSFERRING ;

            return true
        }
        return false
    },

    // WORKER targets

    target_build_structure: function (CREEP) {

        for (let type in Memory.lists.buildStructures) {

            let STRUCTURE_TYPE = Memory.lists.buildStructures[type] ;
            // get closest Energy STRUCTURE with available capacity
            let CLOSEST_BUILD_STRUCTURE = CREEP.pos.findClosestByPath(FIND_CONSTRUCTION_SITES,
                {filter: (e) => e.structureType === STRUCTURE_TYPE});

            if (CLOSEST_BUILD_STRUCTURE) {

                CREEP.memory.targetId = CLOSEST_BUILD_STRUCTURE.id ;
                CREEP.memory.state = STATES.BUILDING ;

                return true
            }
        }
        return false
    },

    target_build_structure_in_range_to: function (CREEP) {

        for (let type in Memory.lists.buildStructures) {

            let STRUCTURE_TYPE = Memory.lists.buildStructures[type] ;
            // get closest Energy STRUCTURE with available capacity

            // get closest Energy STRUCTURE with available capacity
            let structuresInRange = CREEP.pos.findInRange(FIND_CONSTRUCTION_SITES,
                Memory.settings.default_search_radius,
                {filter: (e) => e.structureType === STRUCTURE_TYPE});

            if (structuresInRange[0]) {

                let CLOSEST_BUILD_STRUCTURE = CREEP.pos.findClosestByPath(structuresInRange);

                if (CLOSEST_BUILD_STRUCTURE) {

                    CREEP.memory.targetId = CLOSEST_BUILD_STRUCTURE.id ;
                    CREEP.memory.state = STATES.BUILDING ;

                    return true
                }
            }

        }
        return false
    },

    target_repair_structure: function (CREEP){

        for (let type in Memory.lists.repairStructures) {

            let STRUCTURE_TYPE = Memory.lists.repairStructures[type] ;
            // get closest Energy STRUCTURE with available capacity
            let CLOSEST_BUILD_STRUCTURE = CREEP.pos.findClosestByPath(FIND_STRUCTURES,
                {filter: (s) => s.structureType === STRUCTURE_TYPE
                        && s.hits < (.5 * s.hitsMax)});

            if (CLOSEST_BUILD_STRUCTURE) {

                CREEP.memory.targetId = CLOSEST_BUILD_STRUCTURE.id ;
                CREEP.memory.state = STATES.REPAIRING ;

                return true
            }
        }
        return false
    },

    // validate TARGET by verifying target has enough capacity for all CREEPs
    // ONLY used for CLOSEST_TO targets

    target_energy_validate: function (CREEP, ENERGY_STRUCTURE) {

        // get ENERGY REQUIRED
        let storageAvailable = ENERGY_STRUCTURE.energyCapacity - ENERGY_STRUCTURE.energy ;


        let sumAssignedCreeps = _.sum(Game.creeps,
            (c) => c.memory.targetId === ENERGY_STRUCTURE.id);

        let totalEnergyInRoute = 0 ;

        if (sumAssignedCreeps === 0) {

            return true
        }
        else {

            for (let name in Game.creeps) {

                let CURRENT_CREEP = Game.creeps[name];

                if (CURRENT_CREEP.memory.targetId === ENERGY_STRUCTURE.id) {

                    totalEnergyInRoute += _.sum(CURRENT_CREEP.carry) ;
                }
            }

            if (totalEnergyInRoute >= storageAvailable) {

                return false;
            }
        }
        // default is return GOOD TARGET (true)
        return true;
    },

    target_storage_validate: function (CREEP, RESOURCE_STRUCTURE) {

        // get available STORAGE capacity
        let storageAvailable = RESOURCE_STRUCTURE.storeCapacity - _.sum(RESOURCE_STRUCTURE.store);

        let sumAssignedCreeps = _.sum(Game.creeps,
            (c) => c.memory.targetId === RESOURCE_STRUCTURE.id);

        if (sumAssignedCreeps === 0) {

            return true
        }
        else {

            let totalEnergyInRoute = 0 ;

            for (let name in Game.creeps) {

                let CURRENT_CREEP = Game.creeps[name];

                if (CURRENT_CREEP.targetId === RESOURCE_STRUCTURE.id) {

                    totalEnergyInRoute += _.sum(CURRENT_CREEP.carry) ;
                }
            }

            // if there is not enough available capacity, return BAD TARGET (false)
            if (totalEnergyInRoute >= storageAvailable) {

                return false;
            }
        }
        // default is return GOOD TARGET (true)
        return true;
    }
};