class Ticker {
    constructor() {
        let new_frame_callbacks = [];
        let paused = false;
        let req_id = null;
        const frame_handler = (timestamp) => {
            req_id = requestAnimationFrame(frame_handler);
            new_frame_callbacks.forEach(calback => calback());
        };
        req_id = requestAnimationFrame(frame_handler);
        this.onNewFrame = (callback) => {
            new_frame_callbacks.push(callback);
        };
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
        this.onupdate = (time) => { };
        let ticker;
        let timestamp;
        const properties = {
            value: null,
            duration: null
        };
        this.start = (value) => {
            ticker = new Ticker();
            properties.duration = value;
            this.value = value;
            this.onupdate(value);
            timestamp = performance.now();
            const frame_handler = () => {
                const old_timestamp = timestamp;
                timestamp = performance.now();
                this.value = this.value - (timestamp - old_timestamp);
                if (this.value <= 0) {
                    this.value = 0;
                    ticker.pause();
                }
            };
            ticker.onNewFrame(frame_handler);
        };
        let pause_timestamp = null;
        this.pause = () => {
            if (!pause_timestamp && ticker) {
                ticker.pause();
                pause_timestamp = performance.now();
            }
        };
        this.stop = () => {
            this.pause();
            this.value = this.duration;
        };
        this.resume = () => {
            if (pause_timestamp && ticker) {
                ticker.resume();
                timestamp += performance.now() - pause_timestamp;
                pause_timestamp = null;
            }
        };
        Object.defineProperties(this, {
            duration: {
                get: () => properties.duration
            },
            value: {
                get: () => properties.value,
                set: value => {
                    properties.value = Math.max(0, Math.min(value, this.duration));
                    this.onupdate(properties.value);
                }
            }
        });
    }
}
/**
@param value time in ms
*/
function update_display(value) {
    const svg = document.getElementById("display-svg");
    if (!svg.contentDocument)
        return;
    const display = svg.contentDocument.getElementById("display");
    if (!display)
        return;
    function x_digit(value, n) {
        return Math.floor(value).toString().padStart(n, "0");
    }
    const ms = Math.round(value);
    let s = ms / 1000, m = s / 60, h = m / 60;
    display.innerHTML = `${x_digit(h, 2)}:${x_digit(m, 2)}:${x_digit(s, 2)}.${x_digit((ms % 1000) / 10, 2)}`;
}
function initialization() {
    const countdown = new Countdown();
    countdown.start(10000);
    countdown.onupdate = update_display;
    const controls = document.body.querySelector(".controls");
    function update_play_pause_btn_state(role) {
        const btn = document.getElementById("play-pause-btn");
        if (btn.dataset.role !== role) {
            btn.querySelectorAll(`.${role}-animation`).forEach(ani => ani.beginElement());
            btn.dataset.role = role;
        }
    }
    const control_handlers = {
        play: (el) => {
            update_play_pause_btn_state("pause");
            countdown.resume();
        },
        pause: (el) => {
            update_play_pause_btn_state("play");
            countdown.pause();
        },
        stop: (el) => {
            countdown.stop();
            update_play_pause_btn_state("play");
        }
    };
    controls.addEventListener("click", (ev) => {
        const target = ev.target.closest("svg");
        if (target.dataset.role) {
            control_handlers[target.dataset.role](target);
        }
    });
}
initialization();
