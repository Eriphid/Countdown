class Stopwatch {
    snap: Snap.Paper
    display: {
        mm: [Snap.Element, Snap.Element],
        ss: [Snap.Element, Snap.Element],
        ms: [Snap.Element, Snap.Element]
    }
    frame: Snap.Element

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
            for(let key in display)
            {
                let digits: Snap.Element[] = this.display[key] = [];
                digits[0] = display[key].select(":last-child");
                digits[1] = display[key].select(":first-child");
                for(let i = 0; i < 2; ++i)
                {
                    let bbox = digits[i].getBBox();
                    digits[i] = digits[i].attr({
                        "text-anchor": "end",
                        x: bbox.width + 20
                    })
                }
            }
            this.frame = fragment.select("#frame");

            countdown.onupdate.add(this.update.bind(this));
            this.vibrate();
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
        for(let key in values)
        {
            const group: Snap.Element[] = this.display[key];
            const val = values[key];
            group[0].attr({
                text: Math.floor(val / 10)
            })
            group[1].attr({
                text: val % 10
            })
        }
        // this.display.attr({
        //     text: `${hh}:${mm}:${ss}.${ms}`
        // });
    }

    vibrate() {
        let t_old = 0;
        const audios = [new Audio("audio/B1.mp3"), new Audio("audio/Ab2.mp3"), new Audio("audio/B2.mp3"), new Audio("audio/Ab4.mp3"), new Audio("audio/Ab3.mp3"), new Audio("audio/Db2.mp3")];
        // audios.forEach(audio => audio.volume = 0.25);
        let i = -1;
        countdown.onupdate.add(time => {
            let matrix = Snap.matrix();
            const r = 0.1;
            let s = 1;

            let t = 0;
            if (countdown.state === "stopped") {
                s = 1
            }
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
            if (t > t_old) {
                const audio = audios[i = ++i % audios.length];
                if (audio) {
                    audio.currentTime = 0;
                    audio.volume = 0.25;
                    audio.play().catch(console.error);
                }
            }
            t_old = t;
            matrix.scale(s, s, 305, 328);
            this.frame.transform(matrix.toTransformString());
        })
    }
}

const stopwatch = new Stopwatch(document.getElementById("display") as any);