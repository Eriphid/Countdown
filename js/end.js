function blink() {
    const overlay = document.body.appendChild(document.createElement("div"));
    overlay.classList.add("overlay");
    overlay.style.backgroundColor = "black";
    const tl = new TimelineLite({
        onComplete: () => overlay.remove()
    });
    let on = false;
    const toggle = (delay = 0) => {
        tl.set(overlay, { opacity: (on = !on) ? 0.93 : 0.25 }, `+=${delay / 1000}`);
    };
    [0, 200, 100, 300, 100, 300, 100, 500, 100, 800].forEach(delay => toggle(delay));
    return tl;
}
function lightning() {
    const lighting = document.createElement("div");
    const timeline = new TimelineLite({
        onComplete: () => lighting.remove()
    });
    lighting.classList.add("overlay");
    timeline.call(() => document.body.appendChild(lighting));
    timeline.set(lighting, { backgroundColor: "rgba(0, 0, 0, 0.93)" });
    // timeline.fromTo(lighting, 2, {
    //     backgroundColor: "rgba(0, 0, 0, 0.93)"
    // }, {
    //     backgroundColor: "rgba(0, 0, 0, 1)"
    // });
    const img = lighting.appendChild(document.createElement("div"));
    function trigger(i, delay = 0) {
        timeline.call(() => img.style.backgroundImage = `url(images/lightning-${i}.png)`, null, null, `+=${Math.max(0, delay / 1000 - 1)}`);
        timeline.fromTo(img, 1, {
            opacity: 1
        }, {
            opacity: 0
        });
        timeline.fromTo(lighting, 1, {
            backgroundColor: "rgba(0, 0, 0, 0.4)"
        }, {
            backgroundColor: "rgba(0, 0, 0, 0.95)"
        }, "-=1");
    }
    trigger(1);
    trigger(2, 250);
    return timeline;
}
countdown.onend.add(() => {
    const timeline = blink();
    timeline.add(lightning());
});
