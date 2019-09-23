// import modules
const creepLoadTarget = require('./creep.load.target');
const creepUnloadTarget = require('./creep.unload.target');
const creepBattleLogic = require('./creep.battle.logic');


// store STATE memory prefix for CREEP STATES to make things easier below
const STATES = Memory.lists.creepStates ;

module.exports = {

    run: function (creepId) {

        const CREEP = Game.getObjectById(creepId);

        // review CREEP state before assigning tasks
        this.creepStateReview(CREEP);
        // refresh the TARGET ROOM in case creep changed state
        this.creep_target_room(CREEP);

        // get CREEP to assignedRoom
        if (CREEP.room.name !== CREEP.memory.targetRoom) {

            // get path
            let pathToScoutRoom = Game.map.findRoute(CREEP.room.name, CREEP.memory.targetRoom);

            if (pathToScoutRoom[0]) {

                // get the CLOSEST exit to scout ROOM
                let CLOSEST_EXIT = CREEP.pos.findClosestByRange(pathToScoutRoom[0].exit);

                CREEP.moveTo(CLOSEST_EXIT);
            }
        }

        // move one step into room.  added to stop creep moving back and forth between rooms
        else if (CREEP.pos.x === 49) { CREEP.moveTo(48, CREEP.pos.y) ;}
        else if (CREEP.pos.x === 0) { CREEP.moveTo(1, CREEP.pos.y) ;}
        else if (CREEP.pos.y === 49) { CREEP.moveTo(CREEP.pos.x, 48) ;}
        else if (CREEP.pos.y === 0) { CREEP.moveTo(CREEP.pos.x, 48) ;}

        else {

            // work profile by STATE
            switch (CREEP.memory.state) {

                case STATES.ATTACKING:
                    creepBattleLogic.run(CREEP.id);
                    break;

                case STATES.TARGETING_LD:
                    creepLoadTarget.run(CREEP.id) ;
                    break;

                case STATES.TARGETING_UNLD:
                    creepUnloadTarget.run(CREEP.id) ;
                    break;

                case STATES.HARVESTING:
                    this.creep_harvesting(CREEP) ;
                    break;

                case STATES.PICKING_UP:
                    this.creep_picking_up(CREEP) ;
                    break;

                case STATES.WITHDRAWING:
                    this.creep_withdrawing(CREEP) ;
                    break;

                case STATES.TRANSFERRING:
                    this.creep_transferring(CREEP) ;
                    break;

                case STATES.UPGRADING:
                    this.creep_upgrading(CREEP) ;
                    break;

                case STATES.BUILDING:
                    this.creep_building(CREEP) ;
                    break;

                case STATES.REPAIRING:
                    this.creep_repairing(CREEP) ;
                    break;

                case STATES.SCOUTING:
                    this.creep_scouting(CREEP) ;
                    break;

                case STATES.DROPPING:
                    this.creep_dropping(CREEP) ;
                    break;
            }
        }
    },

    creep_harvesting: function (CREEP) {

        let TARGET_SOURCE = Game.getObjectById(CREEP.memory.targetId);

        let harvestResult = CREEP.harvest(TARGET_SOURCE);

        switch (harvestResult) {

            case OK:
                // no changes, keep harvesting
                break;

            case ERR_INVALID_TARGET:
                console.log(CREEP.name + ' is reporting an invalid source. INVALID TARGET: ' + TARGET_SOURCE);
                break;

            default:
                CREEP.moveTo(TARGET_SOURCE);
                break;
        }
    },

    creep_picking_up: function (CREEP) {

        let PICKUP_TARGET = Game.getObjectById(CREEP.memory.targetId);

        let pickupResult = CREEP.pickup(PICKUP_TARGET);

        switch (pickupResult) {

            case ERR_NOT_IN_RANGE:

                CREEP.moveTo(PICKUP_TARGET);
                break;

            case ERR_FULL:
                CREEP.memory.state = STATES.TARGETING_UNLD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;


            default:
                CREEP.memory.state = STATES.TARGETING_LD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;
        }
    },

    creep_withdrawing: function (CREEP) {

        let WITHDRAW_TARGET = Game.getObjectById(CREEP.memory.targetId);

        let withdrawResult = CREEP.withdraw(WITHDRAW_TARGET, RESOURCE_ENERGY);

        switch (withdrawResult) {

            case ERR_NOT_IN_RANGE:
                CREEP.moveTo(WITHDRAW_TARGET);

                break;

            case ERR_FULL:
                CREEP.memory.state = STATES.TARGETING_UNLD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;


            default:
                CREEP.memory.state = STATES.TARGETING_LD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;
        }
    },

    creep_transferring: function (CREEP) {

        let TRANSFER_TARGET = Game.getObjectById(CREEP.memory.targetId);

        let transferResult = CREEP.transfer(TRANSFER_TARGET, RESOURCE_ENERGY);

        switch (transferResult) {

            case ERR_NOT_IN_RANGE:

                CREEP.moveTo(TRANSFER_TARGET);
                break;

            case ERR_NOT_ENOUGH_RESOURCES:
                CREEP.memory.state = STATES.TARGETING_LD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;


            default:
                CREEP.memory.state = STATES.TARGETING_UNLD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;
        }
    },

    creep_upgrading: function (CREEP) {

        let UPGRADE_TARGET = Game.getObjectById(CREEP.memory.targetId);

        let upgradeResult = CREEP.upgradeController(UPGRADE_TARGET);

        switch (upgradeResult) {

            case OK:
                // no changes
                break;

            case ERR_NOT_IN_RANGE:

                CREEP.moveTo(UPGRADE_TARGET);
                break;

            case ERR_NOT_ENOUGH_RESOURCES:
                CREEP.memory.state = STATES.TARGETING_LD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;


            default:
                CREEP.memory.state = STATES.TARGETING_UNLD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;
        }
    },

    creep_building: function (CREEP) {

        let BUILD_TARGET = Game.getObjectById(CREEP.memory.targetId);

        let buildResult = CREEP.build(BUILD_TARGET);

        switch (buildResult) {

            case OK:
                // no changes
                break;

            case ERR_NOT_IN_RANGE:

                CREEP.moveTo(BUILD_TARGET);
                break;

            case ERR_NOT_ENOUGH_RESOURCES:
                CREEP.memory.state = STATES.TARGETING_LD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;


            default:
                CREEP.memory.state = STATES.TARGETING_UNLD ;
                CREEP.memory.targetId = undefined ;
                CREEP.memory.targetRoom = undefined ;
                break;
        }
    },

    creep_repairing: function (CREEP) {

        let REPAIR_TARGET = Game.getObjectById(CREEP.memory.targetId);

        if (REPAIR_TARGET.hits === REPAIR_TARGET.hitsMax) {

            CREEP.memory.state = STATES.TARGETING_UNLD ;
            CREEP.memory.targetId = undefined ;
            CREEP.memory.targetRoom = undefined ;
        }

        else {

            let repairResult = CREEP.repair(REPAIR_TARGET);

            switch (repairResult) {

                case OK:
                    // no changes
                    break;

                case ERR_NOT_IN_RANGE:

                    CREEP.moveTo(REPAIR_TARGET);
                    break;

                case ERR_NOT_ENOUGH_RESOURCES:
                    CREEP.memory.state = STATES.TARGETING_LD ;
                    CREEP.memory.targetId = undefined ;
                    CREEP.memory.targetRoom = undefined ;
                    break;


                default:
                    CREEP.memory.state = STATES.TARGETING_UNLD ;
                    CREEP.memory.targetId = undefined ;
                    CREEP.memory.targetRoom = undefined ;
                    break;
            }
        }
    },

    creep_scouting: function (CREEP) {

        if (CREEP.room.name !== CREEP.memory.scoutRoom) {

            // get path
            let pathToScoutRoom = Game.map.findRoute(CREEP.room.name, CREEP.memory.scoutRoom);

            if (pathToScoutRoom[0]) {

                // get the CLOSEST exit to scout ROOM
                let CLOSEST_EXIT = CREEP.pos.findClosestByPath(pathToScoutRoom[0].exit);

                CREEP.moveTo(CLOSEST_EXIT);

            }
        }
        else {
            CREEP.moveTo(25, 25);
        }
    },

    creep_dropping: function (CREEP) {

        let DROP_TARGET = Game.getObjectById(CREEP.memory.targetId);

        let rangeToTarget = CREEP.pos.getRangeTo(DROP_TARGET);

        if (rangeToTarget <= 4) {

            CREEP.drop(RESOURCE_ENERGY);
            CREEP.memory.state = STATES.TARGETING_LD ;
            CREEP.memory.targetId = undefined ;
            CREEP.memory.targetRoom = undefined ;

        }
        else {
            CREEP.moveTo(DROP_TARGET);

        }
    },

    // check for creeps who need a change
    creepStateReview: function(CREEP) {

        // if CREEP has no CARRY part
        if (CREEP.carryCapacity === 0) {
            // do nothing.  CARRY-less CREEPS are stuck harvesting until they die.
        }

        // if CREEP is full but in LOADING STATE
        else if (_.sum(CREEP.carry) === CREEP.carryCapacity
            // numeric range of LOADING states
            && (10 <= CREEP.memory.state && CREEP.memory.state <= 19)) {

            CREEP.memory.state = STATES.TARGETING_UNLD ;
            CREEP.memory.targetId = undefined ;
            CREEP.memory.targetRoom = undefined ;
        }

        // if CREEP is empty but in UNLOADING STATE
        else if (_.sum(CREEP.carry) === 0

            // numeric range of UNLOADING states
            && (20 <= CREEP.memory.state && CREEP.memory.state <= 29)) {

            CREEP.memory.state = STATES.TARGETING_LD ;
            CREEP.memory.targetId = undefined ;
            CREEP.memory.targetRoom = undefined ;
        }
    },
    // updates TARGET ROOM based in state
    creep_target_room: function (CREEP) {

        if (CREEP.memory.state >= 10 && CREEP.memory.state < 19) {


            switch (CREEP.memory.role) {

                case "harvester":
                case "remHarvester":
                    CREEP.memory.targetRoom = CREEP.memory.sourceRoom ;
                    break;

                case "carrier":
                case "remCarrier":
                    CREEP.memory.targetRoom = CREEP.memory.loadRoom ;
                    break;

                case "worker":
                case "remWorker":
                case "upgrader":
                    CREEP.memory.targetRoom = CREEP.memory.controllerRoom ;
                    break;
            }
        }
        else if (CREEP.memory.state >= 20 && CREEP.memory.state < 29) {


            switch (CREEP.memory.role) {

                case "harvester":
                case "remHarvester":
                    CREEP.memory.targetRoom = CREEP.memory.sourceRoom ;
                    break;

                case "carrier":
                case "remCarrier":
                    CREEP.memory.targetRoom = CREEP.memory.unloadRoom ;
                    break;

                case "worker":
                case "remWorker":
                case "upgrader":
                    CREEP.memory.targetRoom = CREEP.memory.controllerRoom ;
                    break;

            }
        }
    },
};