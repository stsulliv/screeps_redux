// import modules

// store STATE memory prefix for CREEP STATES to make things easier below
const STATES = Memory.lists.creepStates ;

module.exports = {
    run: function (creepId) {

        // store memory prefix for CREEP STATES to make thins easier below
        const CREEP = Game.getObjectById(creepId);

        switch (CREEP.memory.role) {

            case "soldier":

                this.soldier_attack(CREEP);
                break;

            case "archer":

                break;

        }
    },

    // HARVESTERS only harvest or TRANSFER to nearby STORAGE.  Some HARVESTERS will
    // have CARRY parts, some will not.  If it has a CARRY, it should check nearby area
    // for DROPPED ENERGY from harvesters without CARRY and TRANSFER to storage
    soldier_attack: function (CREEP) {

        let CLOSEST_HOSTILE = CREEP.pos.findClosestByPath(FIND_HOSTILE_CREEPS)

        if (CLOSEST_HOSTILE) {

            let attackResult = CREEP.attack(CLOSEST_HOSTILE);

            if (attackResult === ERR_NOT_IN_RANGE) {

                CREEP.moveTo(CLOSEST_HOSTILE);
            }
        }

    },


};