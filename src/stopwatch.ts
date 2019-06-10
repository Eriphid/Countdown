class Stopwatch {
    snap: Snap.Paper
    display: {
        mm: [Snap.Element, Snap.Element],
        ss: [Snap.Element, Snap.Element],
        ms: [Snap.Element, Snap.Element]
    }
    frame: Snap.Element
    onload = new CallbackGroup(this)

    constructor(element: SVGElement) {
        const div = Snap(element);
        Snap.load("images/stopwatch.svg", fragment => {
            div.append(fragment as any);
            this.snap = div.select("svg") as Snap.Paper;
            let display = {
                mm: fragment.select("#mm"),
                ss: fragment.select("#ss"),
                ms: fragment.select("#ms")
            }
            this.display = {} as any;
            for (let key in display) {
                let digits: Snap.Element[] = this.display[key] = [];
                digits[0] = display[key].select(":last-child");
                digits[1] = display[key].select(":first-child");
                for (let i = 0; i < 2; ++i) {
                    let bbox = (digits[i].node as any).getBBox();
                    digits[i] = digits[i].attr({
                        "text-anchor": "end",
                        x: bbox.width
                    })
                }
            }
            this.frame = fragment.select("#frame");

            this.onload.call();
        });
    }

    update(time: number) {
        if (!this.display) return;
        const date = new Date(0);
        date.setUTCMilliseconds(time);
        const pad = (value: number, digits = 2) => value.toString().padStart(digits, "0");
        const values = {
            mm: pad(date.getUTCMinutes()),
            ss: pad(date.getUTCSeconds()),
            ms: pad(Math.floor(date.getUTCMilliseconds() / 10))
        }
        for (let key in values) {
            const group: Snap.Element[] = this.display[key];
            const val = values[key];
            group[0].attr({
                text: Math.floor(val / 10)
            })
            group[1].attr({
                text: val % 10
            })
        }
    }

    start_scale_animation() {
        let t_old = 0;

        // The different sound play each seconds alternatively
        const audios = [
            new Audio("audio/B1.mp3"),
            new Audio("audio/Ab2.mp3"),
            new Audio("audio/B2.mp3"),
            new Audio("audio/Ab4.mp3"),
            new Audio("audio/Ab3.mp3"),
            new Audio("audio/Db2.mp3")
        ];

        let i = -1;
        countdown.onupdate.add(time => {
            let matrix = Snap.matrix();
            const r = 0.1;
            let s = 1;

            // Scale according to the value of milliseconds
            let t = 0;
            // Do not scale if the countdown is stopped
            if (countdown.state === "stopped") {
                s = 1
            }
            // Do not scale down if the countdown is about to be stopped
            else if (time > 1000) {
                const d = 500;
                t = Math.max(0, time % 1000 - 1000 + d) / d;
                s = 1 - (r / 2) + t * r;
            }
            else {
                const d = 250;
                t = Math.max(0, time % 1000 - 1000 + d) / d;
                s = 1 + (t * r) / 2;
            }

            // Check if a new second began
            if (t > t_old) {
                // Play a sound and advance i to the next one
                const audio = audios[i = ++i % audios.length];
                if (audio) {
                    audio.currentTime = 0;
                    audio.volume = 0.25;
                    audio.play().catch(console.error);
                }
            }
            t_old = t;

            // Scale the stopwatch from the center of the display
            matrix.scale(s, s, 305, 328);
            this.frame.transform(matrix.toTransformString());
        })
    }
}

(function () {
    const stopwatch = new Stopwatch(document.getElementById("display") as any);
    countdown.onupdate.add(stopwatch.update.bind(stopwatch));
    stopwatch.onload.add(stopwatch.start_scale_animation.bind(stopwatch));
})();