(function () {
    const SVGPath = {
        play: "m 0 0 l 5 2.5 l 0 5 l -5 2.5 z M 5 2.5 l 5 2.5 l 0 0 l -5 2.5 z",
        pause: "m 0 0 l 4 0 l 0 10 l -4 0 z M 6 0 l 4 0 l 0 10 l -4 0 z",
        stop: "m 0 0 l 10 0 l 0 10 l -10 0 z"
    }

    interface Control {
        btn: HTMLButtonElement,
        snap: Snap.Element,
        shape: Snap.Element
    }

    function initialize() {
        const control_group = document.body.querySelector(".controls");
        let btnmap = new Map<string, Control>();

        function set_role(btn: Control, role: keyof typeof SVGPath) {
            if (btn.btn.dataset.role === role) return;
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

                btn.addEventListener("click", () => handlers[btn.dataset.role]());

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
        const statehandler = (state: typeof countdown.state) => {
            const play = btnmap.get("play");
            set_role(play, state === "runing" ? "pause" : "play");
        }

        countdown.onstatechanged.add(statehandler);
        countdown.onupdate.add(value => btnmap.get("play").btn.disabled = value <= 0);

        statehandler(countdown.state);
    }

    initialize();
})();