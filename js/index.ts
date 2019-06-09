declare var TweenLite: typeof import("gsap").TweenLite;
declare var TimelineLite: typeof import("gsap").TimelineLite;
declare var Snap: typeof import("snapsvg");

interface SVGAnimateElement {
    beginElement(): void
}

interface NodeListOf<TNode extends Node> {
    [Symbol.iterator](): Iterator<TNode>
}

var countdown: Countdown;

const SVGPath = {
    play: "m 0 0 l 5 2.5 l 0 5 l -5 2.5 z M 5 2.5 l 5 2.5 l 0 0 l -5 2.5 z",
    pause: "m 0 0 l 4 0 l 0 10 l -4 0 z M 6 0 l 4 0 l 0 10 l -4 0 z",
    stop: "m 0 0 l 10 0 l 0 10 l -10 0 z"
}

class CallbackGroup<Callback extends Function>
{
    thisArg: any
    callbacks: Callback[] = []
    call(...args: any[]) {
        this.callbacks.forEach(callback => callback.call(this.thisArg, ...args));
    }

    add(...callbacks: Callback[]) {
        this.callbacks.push(...callbacks);
    }

    constructor(thisArg = null) {
        this.thisArg = thisArg;
    }
}

class Ticker {
    onnewframe = new CallbackGroup<(timestamp: DOMHighResTimeStamp) => any>(this)
    paused!: boolean
    pause: () => void
    resume: () => void

    constructor() {
        let paused = false;

        let req_id = null;
        const frame_handler = (timestamp: DOMHighResTimeStamp) => {
            req_id = requestAnimationFrame(frame_handler);
            this.onnewframe.call(timestamp);
        }
        req_id = requestAnimationFrame(frame_handler);

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

    onupdate = new CallbackGroup<(time: DOMHighResTimeStamp) => any>(this);
    onstatechanged = new CallbackGroup<(state: "runing" | "paused" | "stopped") => any>(this);

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

            ticker.onnewframe.add(frame_handler);
        }

        this.start = (value: number) => {
            if (!ticker) initialize_ticker();

            properties.duration = value;
            this.value = value;

            this.onstatechanged.call("runing")
            this.onupdate.call(value);

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
                    this.onupdate.call(properties.value);
                }
            },
            state: {
                get: () => properties.state,
                set: (value) => {
                    properties.state = value;
                    this.onstatechanged.call(value);
                }
            }
        })
    }
}

/**
@param value time in ms
*/
function update_display(value: number) {
    const svg = document.getElementById("display") as HTMLObjectElement;
    if (!svg.contentDocument)
        return;
    const display = svg.contentDocument.getElementById("display");
    if (!display)
        return;

    function x_digit(value: number, n: number) {
        return Math.floor(value).toString().padStart(n, "0");
    }
    const ms = Math.round(value);
    let s = ms / 1000, m = s / 60, h = m / 60;
    display.innerHTML = `${x_digit(h, 2)}:${x_digit(m, 2)}:${x_digit(s, 2)}.${x_digit((ms % 1000) / 10, 2)}`;
}

interface Control {
    btn: HTMLButtonElement,
    snap: Snap.Element,
    shape: Snap.Element
}

function initialize_controls() {
    const control_group = document.body.querySelector(".controls");
    let btnmap = new Map<string, Control>();

    function set_role(btn: Control, role: keyof typeof SVGPath) {
        btn.btn.dataset.role = role;
        btn.shape.animate({
            d: SVGPath[role]
        }, 300, mina.linear);
    }

    const handlers = {
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

    {
        const buttons = control_group.querySelectorAll<HTMLButtonElement>("button[data-role]");
        for (let btn of buttons) {
            const svg_element = btn.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
            const role = btn.dataset.role;
            const s = Snap(svg_element);

            btn.addEventListener("click", () => handlers[role]());

            s.attr({
                viewBox: "0 0 10 10"
            })
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
        play.btn.disabled = (countdown.value === 0);
        set_role(play, state === "runing" ? "pause" : "play");
    })
}


function initialization() {
    countdown = new Countdown();
    countdown.onupdate.add(update_display);
    initialize_controls();
    countdown.start(10000);
}

initialization();