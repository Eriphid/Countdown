type TweenLite = gsap.TweenLite;
declare var TweenLite: typeof gsap.TweenLite;
type TimelineLite = gsap.TimelineLite;
declare var TimelineLite: typeof gsap.TimelineLite;
declare var Snap: typeof import("snapsvg");

interface SVGAnimateElement {
    beginElement(): void
}

interface NodeListOf<TNode extends Node> {
    [Symbol.iterator](): Iterator<TNode>
}

let countdown: Countdown;

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
    onend = new CallbackGroup();

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
                    ticker.pause();
                    this.state = "stopped";
                    timestamp = null;
                    this.onend.call();
                }
            };

            ticker.onnewframe.add(frame_handler);
        }

        this.start = (value: number) => {
            if (!ticker) initialize_ticker();

            properties.duration = value;
            this.value = value;

            this.state = "runing";
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
            ticker.pause();
            pause_timestamp = null;
            this.state = "stopped";
            this.value = this.duration;
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
                    if(value === properties.state) return;
                    properties.state = value;
                    this.onstatechanged.call(value);
                }
            }
        })
    }
}

countdown = new Countdown();
countdown.start(10000);