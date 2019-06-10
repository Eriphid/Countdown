let overlay;
function create_overlay() {
    let overlay = document.body.appendChild(document.createElement("div"));
    overlay.classList.add("overlay");
    overlay.style.backgroundColor = "black";
    return overlay;
}
function blink() {
    const audio = new Audio("audio/light.ogg");
    const timeline = new TimelineLite();
    let on = false;
    const toggle = (delay = 0) => {
        const opacity = (on = !on) ? 0.93 : 0.25;
        timeline.set(overlay, { backgroundColor: `rgba(0, 0, 0, ${opacity})` }, `+=${delay / 1000}`);
        if (on) {
            timeline.call(() => {
                audio.currentTime = 0;
                audio.play().catch(console.error);
            });
        }
    };
    [0, 200, 100, 300, 100, 300, 100, 500, 100, 800].forEach(delay => toggle(delay));
    return timeline;
}
function lightning() {
    const timeline = new TimelineLite();
    timeline.set(overlay, { backgroundColor: "rgba(0, 0, 0, 0.93)" });
    // timeline.fromTo(lighting, 2, {
    //     backgroundColor: "rgba(0, 0, 0, 0.93)"
    // }, {
    //     backgroundColor: "rgba(0, 0, 0, 1)"
    // });
    const lightning_box = overlay.appendChild(document.createElement("div"));
    function trigger(i, delay = 0) {
        timeline.call(() => lightning_box.style.backgroundImage = `url(images/lightning-${i}.png)`, null, null, `+=${Math.max(0, delay / 1000 - 1)}`);
        timeline.fromTo(lightning_box, 1, {
            opacity: 1
        }, {
            opacity: 0
        });
        timeline.fromTo(overlay, 0.4, {
            backgroundColor: "rgba(0, 0, 0, 0.3)"
        }, {
            backgroundColor: "rgba(0, 0, 0, 0.95)"
        }, "-=1");
    }
    trigger(1);
    trigger(2, 250);
    timeline.call(() => lightning_box.remove());
    return timeline;
}
overlay = create_overlay();
overlay.style.display = "none";
countdown.onend.add(() => {
    const timeline = new TimelineLite();
    timeline.set(overlay, {
        display: "block",
        opacity: 1
    });
    timeline.add(blink());
    timeline.add(lightning());
    timeline.to(overlay, 0.2, { opacity: 0 }, "+=0.5");
    timeline.set(overlay, { display: "none" });
});
