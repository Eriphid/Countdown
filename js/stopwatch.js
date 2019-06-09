class Stopwatch {
    constructor(element) {
        this.snap = Snap(element);
        Snap.load("images/stopwatch.svg", fragment => {
            this.snap.append(fragment);
            this.display = fragment.select("#display");
            this.frame = fragment.select("#stopwatch");
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
        const bbox = this.display.getBBox();
        countdown.onupdate.add(time => {
            let matrix = Snap.matrix();
            const r = 0.1;
            let s = 1;
            if (countdown.state === "stopped") {
                s = 1;
            }
            else if (time < 1000) {
                const t = Math.max(0, time % 1000 - 750) / 250;
                s = 1 + (t * r) / 2;
            }
            else {
                const t = Math.max(0, time % 1000 - 500) / 500;
                s = 1 - (r / 2) + t * r;
            }
            matrix.scale(s, s, bbox.cx + 112, bbox.cy + 220);
            this.frame.transform(matrix.toTransformString());
        });
    }
}
