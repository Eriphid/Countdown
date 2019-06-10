(function () {
    let overlay;
    const audio = {
        thunder: [new Audio("audio/thunder-1.mp3"), new Audio("audio/thunder-2.mp3")],
        light: new Audio("audio/light.ogg")
    };
    function create_overlay() {
        let overlay = document.body.appendChild(document.createElement("div"));
        overlay.classList.add("overlay");
        overlay.style.backgroundColor = "black";
        return overlay;
    }
    function blink(on_alpha, off_alpha) {
        const timeline = new TimelineLite();
        let on = false;
        // Switch the black overlay's opacity between on_alpha & off_alpha
        // Play a sound each time opacity is switched to on_alpha
        // Simulate a light bulb disfunctioning
        const toggle = (delay = 0) => {
            const opacity = (on = !on) ? on_alpha : off_alpha;
            timeline.set(overlay, { backgroundColor: `rgba(0, 0, 0, ${opacity})` }, `+=${delay / 1000}`);
            if (on) {
                timeline.call(() => {
                    audio.light.currentTime = 0;
                    audio.light.play().catch(console.error);
                });
            }
        };
        // Call toggle() for each value
        [0, 200, 100, 300, 100, 300, 100, 500, 100, 800].forEach(delay => toggle(delay));
        return timeline;
    }
    function lightning() {
        const timeline = new TimelineLite();
        timeline.set(overlay, { backgroundColor: "rgba(0, 0, 0, 0.93)" });
        const lightning_box = overlay.appendChild(document.createElement("div"));
        function trigger(i, delay = 0) {
            // Set lightning box's background to the specified lightning image
            // Play a thunder sound
            timeline.call(() => {
                lightning_box.style.backgroundImage = `url(images/lightning-${i + 1}.png)`;
                audio.thunder[i].currentTime = 0;
                audio.thunder[i].play().catch(console.error);
            }, null, null, `+=${Math.max(0, delay / 1000 - 1)}`);
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
        trigger(0);
        trigger(1, 250);
        timeline.call(() => lightning_box.remove());
        return timeline;
    }
    overlay = create_overlay();
    overlay.style.display = "none";
    countdown.onend.add(() => {
        const timeline = new TimelineLite();
        timeline.set(overlay, {
            display: "block",
            backgroundColor: "rgba(0, 0, 0, 0.93)"
        });
        timeline.add(blink(0.93, 0.25));
        timeline.add(lightning());
        timeline.add(blink(0, 0.95), "+=1.5");
        timeline.set(overlay, { display: "none" });
        timeline.to(document.body.querySelector("footer"), 0.5, {
            text: "Is that what we were waiting for? Should we wait more?."
        });
    });
})();
