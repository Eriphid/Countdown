function blink()
{
    const overlay = document.body.appendChild(document.createElement("div"));
    overlay.classList.add("overlay");
    overlay.style.backgroundColor = "black";
    const tl = new TimelineLite({
        onComplete: () => overlay.remove()
    });
    let on = false;
    const toggle = (delay: number) => {
        tl.set(overlay, { opacity: (on = !on) ? 0.85 : 0.3}, `+=${delay / 1000}`);
    }
    [0, 200, 100, 300, 100, 500, 100, 1000].forEach(delay => toggle(delay));
    return tl;
}

countdown.onend.add(() => {
    blink();
})