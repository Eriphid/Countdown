let countdown;
const SVGPath = {
    play: "m 0 0 l 5 2.5 l 0 5 l -5 2.5 z M 5 2.5 l 5 2.5 l 0 0 l -5 2.5 z",
    pause: "m 0 0 l 4 0 l 0 10 l -4 0 z M 6 0 l 4 0 l 0 10 l -4 0 z",
    stop: "m 0 0 l 10 0 l 0 10 l -10 0 z"
};
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
function initialize_controls() {
    const control_group = document.body.querySelector(".controls");
    let btnmap = new Map();
    function set_role(btn, role) {
        if (btn.btn.dataset.role === role)
            return;
        btn.btn.dataset.role = role;
        btn.shape.animate({
            d: SVGPath[role]
        }, 300, mina.linear);
    }
    const handlers = {
        play: (el) => {
            countdown.resume();
        },
        pause: (el) => {
            countdown.pause();
        },
        stop: (el) => {
            countdown.stop();
        }
    };
    {
        const buttons = control_group.querySelectorAll("button[data-role]");
        for (let btn of buttons) {
            const svg_element = btn.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
            const role = btn.dataset.role;
            const s = Snap(svg_element);
            btn.addEventListener("click", () => handlers[btn.dataset.role]());
            s.attr({
                viewBox: "0 0 10 10"
            });
            const shape = s.path(SVGPath[role]);
            btnmap.set(role, {
                btn: btn,
                snap: s,
                shape: shape
            });
        }
    }
    countdown.onstatechanged.add((state) => {
        const play = btnmap.get("play");
        set_role(play, state === "runing" ? "pause" : "play");
    });
    countdown.onupdate.add(value => btnmap.get("play").btn.disabled = value <= 0);
}
function initialization() {
    countdown = new Countdown();
    initialize_controls();
    countdown.start(10000);
}
initialization();
