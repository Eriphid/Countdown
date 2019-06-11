(function () {
    const SVGPath = {
        play: "m 0 0 l 5 2.5 l 0 5 l -5 2.5 z M 5 2.5 l 5 2.5 l 0 0 l -5 2.5 z",
        pause: "m 0 0 l 4 0 l 0 10 l -4 0 z M 6 0 l 4 0 l 0 10 l -4 0 z",
        stop: "m 0 0 l 10 0 l 0 10 l -10 0 z"
    }

    interface Control {
        element: HTMLButtonElement,
        shape: Snap.Element
    }

    function create_buttons() {
        let btnmap = new Map<string, Control>();
        const control_group = document.body.querySelector(".controls");
        const handlers = {
            play: (el: HTMLElement) => {
                if (countdown.duration) {
                    countdown.resume()
                } else {
                    popup.show();
                }
            },
            pause: (el: HTMLElement) => countdown.pause(),
            stop: (el: HTMLElement) => countdown.stop()
        }
        const buttons = control_group.querySelectorAll<HTMLButtonElement>("button[data-role]");
        for (let btn of buttons) {
            const svg_element = btn.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
            const role = btn.dataset.role;
            const s = Snap(svg_element);

            btn.addEventListener("click", () => handlers[btn.dataset.role]());

            s.attr({
                viewBox: "0 0 10 10"
            })
            const shape = s.path(SVGPath[role]);
            btnmap.set(role, {
                element: btn,
                shape: shape
            });
        }
        return btnmap;
    }

    function initialize() {
        const btnmap = create_buttons();

        function set_role(btn: Control, role: keyof typeof SVGPath) {
            if (btn.element.dataset.role === role) return;
            btn.element.dataset.role = role;
            btn.shape.animate({
                d: SVGPath[role]
            }, 300, mina.linear);
        }

        const statehandler = (state: typeof countdown.state) => {
            const play = btnmap.get("play");
            set_role(play, state === "runing" ? "pause" : "play");
            play.element.disabled = (countdown.value <= 0 && countdown.duration > 0);
            btnmap.get("stop").element.disabled = (state === "stopped" && (countdown.duration == countdown.value));
        }

        countdown.onstatechanged.add(statehandler);
        // Disable play/pause button when coutdown reach 0
        // Enable it otherwise
        countdown.onreset.add(() => {
            btnmap.get("play").element.disabled = false;
            btnmap.get("stop").element.disabled = true;
        });
        countdown.onend.add(() => {
            btnmap.get("play").element.disabled = true;
            btnmap.get("stop").element.disabled = false;
        })

        statehandler(countdown.state);

        const form = document.getElementById("time-form");
        form.addEventListener("submit", (ev) => {
            ev.preventDefault();
            popup.submit();
        })
    }

    initialize();
})();