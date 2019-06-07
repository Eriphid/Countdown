(function () {
    const svg_ns = "http://www.w3.org/2000/svg";

    const SVGPath = {
        play: "m 0 0 l 10 5 l -10 5 z",
        pause: "m 0 0 l 4 0 l 0 10 l -4 0 z M 6 0 l 4 0 l 0 10 l -4 0 z"
    }

    let timer = {
        start: 0,
        curr: 0,
        req_id: null
    }

    const display = document.getElementById("display");

    function set_display(ms) {
        function x_digit(value, n) {
            let str = Math.floor(value).toString();
            while (str.length < n) {
                str = '0' + str;
            }
            return str;
        }
        ms = Math.round(ms);
        let s = ms / 1000, m = s / 60, h = m / 60;
        display.innerText = `${x_digit(h, 2)}:${x_digit(m, 2)}:${x_digit(s, 2)}.${Math.floor((ms % 1000) / 100)}`;
    }

    function clear_timer() {
        if (timer.req_id !== null) {
            cancelAnimationFrame(timer.req_id);
            timer.req_id = null;
        }
    }

    function start_timer(value) {
        clear_timer();

        timer.start = value;
        timer.curr = value;

        set_display(value);

        let timestamp = performance.now();
        clear_timer();
        const frame_handler = () => {
            timer.req_id = requestAnimationFrame(frame_handler);

            const old_timestamp = timestamp;
            timestamp = performance.now();
            timer.curr = timer.curr - (timestamp - old_timestamp);
            if (timer.curr <= 0) {
                timer.curr = 0;
                clear_timer();
            }
            set_display(timer.curr);

        };
        timer.req_id = requestAnimationFrame(frame_handler);
    }

    function initialize() {
        start_timer(10000);

        const controls = document.body.querySelector(".controls");

        for(let [role, svgpath] of Object.entries(SVGPath))
        {
            const svg = controls.appendChild(document.createElementNS(svg_ns, "svg"));
            const path = svg.appendChild(document.createElementNS(svg_ns, "path"));

            svg.setAttributeNS(null, "viewBox", "0 0 10 10");
            path.setAttributeNS(null, "d", svgpath);
            svg.dataset.role = role;
        }

        const control_handlers= {
            play: () => start_timer(timer.curr),
            pause: clear_timer
        }

        controls.addEventListener("click", (ev) => {
            const target = ev.target.closest("svg");
            if(target.dataset.role)
            {
                control_handlers[target.dataset.role]();
            }
        })

    }

    initialize();
})();