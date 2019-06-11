class Stopwatch {
    constructor(element) {
        this.onload = new CallbackGroup(this);
        const div = Snap(element);
        Snap.load("images/stopwatch.svg", fragment => {
            div.append(fragment);
            let display = {
                mm: fragment.select("#mm"),
                ss: fragment.select("#ss"),
                ms: fragment.select("#ms")
            };
            this.display = {};
            for (let key in display) {
                let digits = this.display[key] = [];
                digits[0] = display[key].select(":last-child");
                digits[1] = display[key].select(":first-child");
                // Move text anchor to end so that number stay align to left when digit is small (like "1")
                for (let i = 0; i < 2; ++i) {
                    let bbox = digits[i].node.getBBox();
                    digits[i] = digits[i].attr({
                        "text-anchor": "end",
                        x: bbox.width
                    });
                }
            }
            this.frame = fragment.select("#frame");
            const btns = {
                left: fragment.select("#btn-left"),
                top: fragment.select("#btn-top"),
                right: fragment.select("#btn-right")
            };
            function add_click_handler(btn, handler, animation = {}) {
                btn.click((ev) => {
                    handler(ev);
                    TweenLite.from(btn.node, 0.2, { x: `+=${animation.x || 0}`, y: `+=${animation.y || 0}` });
                });
            }
            add_click_handler(btns.left, () => {
                if (countdown.duration > 0)
                    countdown.resume();
                else
                    popup.show();
            }, { x: 5, y: 5 });
            add_click_handler(btns.top, () => {
                countdown.pause();
                document.getElementById("time-input").value = "";
                popup.show();
            }, { y: 5 });
            add_click_handler(btns.right, countdown.stop.bind(countdown), { x: -5, y: 5 });
            this.onload.call();
        });
    }
    update(time) {
        if (!this.display)
            return;
        // const pad = (value: number, digits = 2) => value.toString().padStart(digits, "0");
        // const date = new Date(time);
        // const values = {
        //     mm: pad(date.getUTCMinutes()),
        //     ss: pad(date.getUTCSeconds()),
        //     ms: pad(Math.floor(date.getUTCMilliseconds() / 10))
        // }
        const values = {};
        values.ms = Math.round(time);
        values.ss = values.ms / 1000;
        values.mm = values.ss / 60;
        values.ms %= 1000;
        values.mm %= 60;
        values.ms %= 60;
        for (let key in values) {
            const group = this.display[key];
            const val = Math.floor(values[key]).toString().padStart(2, "0");
            group[0].attr({
                text: val[0]
            });
            group[1].attr({
                text: val[1]
            });
        }
    }
    start_scale_animation() {
        let old_time = 0;
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
            // Scale according to the value of milliseconds
            // Do not scale if the countdown is stopped
            if (countdown.state !== "stopped") {
                const d = 500;
                const t = Math.max(0, time % 1000 - 1000 + d) / d;
                const r = 0.1;
                const s = 1 + t * r;
                let matrix = Snap.matrix();
                // Scale the stopwatch from the center of the display
                matrix.scale(s, s, 305, 328);
                this.frame.transform(matrix.toTransformString());
                // Check if a new second began
                if (Math.abs(old_time - time) >= 1000) {
                    // Play a sound and advance i to the next one
                    const audio = audios[i = ++i % audios.length];
                    if (audio) {
                        audio.currentTime = 0;
                        audio.play().catch(console.error);
                    }
                    old_time = time;
                }
            }
        });
    }
}
(function () {
    const stopwatch = new Stopwatch(document.getElementById("display"));
    countdown.onupdate.add(stopwatch.update.bind(stopwatch));
    stopwatch.onload.add(stopwatch.start_scale_animation.bind(stopwatch));
})();
