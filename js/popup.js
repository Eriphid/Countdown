class Popup {
    constructor(element) {
        this.element = element;
        element.addEventListener("click", (ev) => {
            if (ev.target === element)
                this.hide();
        });
    }
    show() {
        TweenLite.fromTo(this.element, 0.4, { opacity: 0, display: "inherit" }, { opacity: 1 });
        document.getElementById("time-input").focus();
    }
    hide() { TweenLite.to(this.element, 0.4, { opacity: 0, onComplete: () => this.element.style.display = "none " }); }
    submit() {
        const value = document.getElementById("time-input").value;
        const match = /^(?:(?:(\d*):)?(\d*):)?(\d*)$/.exec(value.trim());
        if (match) {
            const hh = parseInt(match[1]), mm = parseInt(match[2]);
            let ss = parseInt(match[3]) || 0;
            if (mm)
                ss += mm * 60;
            if (hh)
                ss += hh * 3600;
            // Do not start a timer of 0
            if (ss === 0)
                return;
            if (ss > 3600) {
                ss = 3600;
                console.warn("Duration cannot be over 1 hour");
            }
            this.hide();
            countdown.start(ss * 1000);
        }
        else
            console.error(`"${value}" is not a valid value! Please enter a value in the format hh:mm:ss`);
    }
}
const popup = new Popup(document.getElementById("popup"));
