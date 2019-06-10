let countdown;
class CallbackGroup {
    constructor(thisArg = null) {
        this.callbacks = [];
        this.thisArg = thisArg;
    }
    call(...args) {
        this.callbacks.forEach(callback => callback.call(this.thisArg, ...args));
    }
    add(...callbacks) {
        this.callbacks.push(...callbacks);
    }
}
class Ticker {
    constructor() {
        this.onnewframe = new CallbackGroup(this);
        let paused = false;
        let req_id = null;
        const frame_handler = (timestamp) => {
            req_id = requestAnimationFrame(frame_handler);
            this.onnewframe.call(timestamp);
        };
        req_id = requestAnimationFrame(frame_handler);
        this.pause = () => {
            paused = true;
            cancelAnimationFrame(req_id);
            req_id = null;
        };
        this.resume = () => {
            if (req_id)
                return;
            paused = false;
            req_id = requestAnimationFrame(frame_handler);
        };
        Object.defineProperty(this, "paused", {
            get: () => paused,
            set: (value) => {
                if (value === this.paused)
                    return;
                value ? this.pause() : this.resume();
            }
        });
    }
}
class Countdown {
    constructor() {
        this.onupdate = new CallbackGroup(this);
        this.onstatechanged = new CallbackGroup(this);
        this.onend = new CallbackGroup();
        let ticker;
        let timestamp;
        const properties = {
            value: null,
            duration: null,
            state: "stopped"
        };
        const initialize_ticker = () => {
            ticker = new Ticker();
            const frame_handler = () => {
                const old_timestamp = timestamp;
                timestamp = performance.now();
                this.value = this.value - (timestamp - old_timestamp);
                if (this.value <= 0) {
                    this.value = 0;
                    ticker.pause();
                    this.state = "stopped";
                    timestamp = null;
                    this.onend.call();
                }
            };
            ticker.onnewframe.add(frame_handler);
        };
        this.start = (value) => {
            if (!ticker)
                initialize_ticker();
            properties.duration = value;
            this.value = value;
            this.state = "runing";
            this.onupdate.call(value);
            timestamp = performance.now();
        };
        let pause_timestamp = null;
        this.pause = () => {
            if (!pause_timestamp && ticker) {
                ticker.pause();
                pause_timestamp = performance.now();
                this.state = "paused";
            }
        };
        this.stop = () => {
            ticker.pause();
            pause_timestamp = null;
            this.state = "stopped";
            this.value = this.duration;
        };
        this.resume = () => {
            if (!this.value)
                return false;
            if (ticker) {
                ticker.resume();
                if (pause_timestamp) {
                    timestamp += performance.now() - pause_timestamp;
                    pause_timestamp = null;
                }
                else if (this.duration) {
                    this.start(this.duration);
                }
            }
            else {
                return false;
            }
            this.state = "runing";
            return true;
        };
        Object.defineProperties(this, {
            duration: {
                get: () => properties.duration
            },
            value: {
                get: () => properties.value,
                set: value => {
                    properties.value = Math.max(0, Math.min(value, this.duration));
                    this.onupdate.call(properties.value);
                }
            },
            state: {
                get: () => properties.state,
                set: (value) => {
                    if (value === properties.state)
                        return;
                    properties.state = value;
                    this.onstatechanged.call(value);
                }
            }
        });
    }
}
countdown = new Countdown();
countdown.start(10000);
