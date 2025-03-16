/**
 * Main game controller
 */
class Game {
    constructor() {
        this.initialized = false;
        console.log("Game class initialized");
    }

    init() {
        this.initialized = true;
        console.log("Game initialized");
    }

    start() {
        if (!this.initialized) {
            this.init();
        }
        console.log("Game started");
    }
}

export { Game };
