interface SVGAnimateElement {
    beginElement(): void
}

class Ticker {
    onNewFrame: (callback: (timestamp: DOMHighResTimeStamp) => any) => void
    paused!: boolean
    pause: () => void
    resume: () => void

    constructor() {
        let new_frame_callbacks = []
        let paused = false;

        let req_id = null;
        const frame_handler = (timestamp: DOMHighResTimeStamp) => {
            req_id = requestAnimationFrame(frame_handler);
            new_frame_callbacks.forEach(calback => calback())
        }
        req_id = requestAnimationFrame(frame_handler);

        this.onNewFrame = (callback) => {
            new_frame_callbacks.push(callback);
        };

        this.pause = () => {
            paused = true;
            cancelAnimationFrame(req_id);
            req_id = null;
        }
        this.resume = () => {
            if (req_id) return;
            paused = false;
            req_id = requestAnimationFrame(frame_handler);
        }

        Object.defineProperty(this, "paused", {
            get: () => paused,
            set: (value: boolean) => {
                if (value === this.paused)
                    return;
                value ? this.pause() : this.resume();
            }
        });
    }
}

class Countdown {
    element: HTMLElement

    onupdate = (time: number) => { }
    onstatechanged = (state: "runing" | "paused" | "stopped") => { }

    /**start the countdown
    @param value time in milliseconds
    */
    start: (value: number) => void
    duration: number
    value: number

    resume: () => boolean
    pause: () => void
    stop: () => void

    state: "runing" | "paused" | "stopped"

    constructor() {
        let ticker: Ticker;
        let timestamp: DOMHighResTimeStamp;

        const properties = {
            value: null as number,
            duration: null as number,
            state: "stopped" as Countdown["state"]
        }

        const initialize_ticker = () => {
            ticker = new Ticker();

            const frame_handler = () => {

                const old_timestamp = timestamp;
                timestamp = performance.now();
                this.value = this.value - (timestamp - old_timestamp);
                if (this.value <= 0) {
                    this.value = 0;
                    this.pause();
                    timestamp = null;
                }
            };

            ticker.onNewFrame(frame_handler);
        }

        this.start = (value: number) => {
            if (!ticker) initialize_ticker();

            properties.duration = value;
            this.value = value;

            this.onstatechanged("runing")
            this.onupdate(value);

            timestamp = performance.now();
        }
        let pause_timestamp = null;

        this.pause = () => {
            if (!pause_timestamp && ticker) {
                ticker.pause();
                pause_timestamp = performance.now();
                this.state = "paused";
            }
        }

        this.stop = () => {
            this.pause();
            pause_timestamp = null;
            this.value = this.duration;
            this.state = "stopped";
        }
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
        }

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
            },
            state: {
                get: () => properties.state,
                set: (value) => {
                    properties.state = value;
                    this.onstatechanged(value);
                }
            }
        })
    }
}

/**
@param value time in ms
*/
function update_display(value: number) {
    const svg = document.getElementById("display-svg") as HTMLObjectElement;
    if (!svg.contentDocument)
        return;
    const display = svg.contentDocument.getElementById("display");
    if (!display)
        return;
    const tspan = display.querySelector("tspan");

    function x_digit(value: number, n: number) {
        return Math.floor(value).toString().padStart(n, "0");
    }
    const ms = Math.round(value);
    let s = ms / 1000, m = s / 60, h = m / 60;
    tspan.innerHTML = `${x_digit(h, 2)}:${x_digit(m, 2)}:${x_digit(s, 2)}.${x_digit((ms % 1000) / 10, 2)}`;
}


function initialization() {
    const countdown = new Countdown();

    countdown.onupdate = update_display;

    const controls = document.body.querySelector(".controls");


    function update_play_pause_btn_state(role: "play" | "pause") {
        const btn = document.getElementById("play-pause-btn");
        if (btn.dataset.role !== role) {
            btn.querySelectorAll<SVGAnimateElement>(`.${role}-animation`).forEach(ani => ani.beginElement());
            btn.dataset.role = role;
        }
    }

    const control_handlers = {
        play: (el: HTMLElement) => {
            countdown.resume()
        },
        pause: (el: HTMLElement) => {
            countdown.pause();
        },
        stop: (el: HTMLElement) => {
            countdown.stop()
        }
    }

    countdown.onstatechanged = (state) => {
        switch (state) {
            case "runing":
                update_play_pause_btn_state("pause");
                break;
            case "paused":
            case "stopped":
                update_play_pause_btn_state("play");
                break;
        }
    }

    controls.addEventListener("click", (ev) => {
        if (ev.target === controls)
            return;
        const target = (ev.target as HTMLElement).closest("svg");
        if (target && target.dataset.role) {
            control_handlers[target.dataset.role](target);
        }
    })

    countdown.start(10000);
}

initialization();