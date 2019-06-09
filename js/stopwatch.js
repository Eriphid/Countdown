class Stopwatch {
    constructor(element) {
        this.snap = Snap(element);
        Snap.load("images/stopwatch.svg", fragment => {
            this.snap.append(fragment);
            this.display = fragment.select("#display");
            this.frame = fragment.select("#frame");
            countdown.onupdate.add(this.update.bind(this));
            this.vibrate();
        });
    }
    update(time) {
        if (!this.display)
            return;
        const date = new Date(0);
        date.setUTCMilliseconds(time);
        const pad = (value, digits = 2) => value.toString().padStart(digits, "0");
        const hh = pad(date.getUTCHours()), mm = pad(date.getUTCMinutes()), ss = pad(date.getUTCSeconds()), ms = pad(Math.floor(date.getUTCMilliseconds() / 10));
        this.display.attr({
            text: `${hh}:${mm}:${ss}.${ms}`
        });
    }
    vibrate() {
        countdown.onupdate.add(time => {
            let matrix = Snap.matrix();
            const r = 0.1;
            let s = 1;
            if (countdown.state === "stopped") {
                s = 1;
            }
            else if (time > 1000) {
                const d = 500;
                const t = Math.max(0, time % 1000 - 1000 + d) / d;
                s = 1 - (r / 2) + t * r;
            }
            else {
                const d = 250;
                const t = Math.max(0, time % 1000 - 1000 + d) / d;
                s = 1 + (t * r) / 2;
            }
            matrix.scale(s, s, 305, 328);
            this.frame.transform(matrix.toTransformString());
        });
    }
}
