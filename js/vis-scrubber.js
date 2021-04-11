function visScrubber(
  values,
  container,
  {
    format = (value) => value,
    initial = 0,
    delay = null,
    autoplay = false,
    loop = true,
    alternate = false,
  } = {}
) {
  values = Array.from(values);

  const form = container.append("div").attr("class", "vis-scrubber");
  const button = form.append("button");
  const label = form.append("label");
  const input = label
    .append("input")
    .attr("type", "range")
    .attr("min", 0)
    .attr("max", values.length - 1)
    .attr("value", initial)
    .attr("step", 1);
  const output = label.append("div").attr("class", "output");

  let timer = null;
  let direction = 1;
  function start() {
    button.classed("play-button", false).classed("pause-button", true);
    timer =
      delay === null ? requestAnimationFrame(tick) : setInterval(tick, delay);
  }
  function stop() {
    button.classed("play-button", true).classed("pause-button", false);
    if (delay === null) cancelAnimationFrame(timer);
    else clearInterval(timer);
    timer = null;
  }
  function tick() {
    if (delay === null) timer = requestAnimationFrame(tick);
    if (
      input.node().valueAsNumber ===
      (direction > 0 ? values.length - 1 : direction < 0 ? 0 : NaN)
    ) {
      if (!loop) return stop();
      if (alternate) direction = -direction;
    }
    input.node().valueAsNumber =
      (input.node().valueAsNumber + direction + values.length) % values.length;
    input.node().dispatchEvent(
      new CustomEvent("input", {
        bubbles: true,
      })
    );
  }
  input.node().oninput = (event) => {
    if (event && event.isTrusted && timer) button.node().onclick();
    output.text(
      format(
        values[input.node().valueAsNumber],
        input.node().valueAsNumber,
        values
      )
    );
  };
  button.node().onclick = () => {
    if (timer) return stop();
    direction =
      alternate && input.node().valueAsNumber === values.length - 1 ? -1 : 1;
    input.node().valueAsNumber =
      (input.node().valueAsNumber + direction) % values.length;
    input.node().dispatchEvent(
      new CustomEvent("input", {
        bubbles: true,
      })
    );
    start();
  };
  input.node().oninput();
  if (autoplay) start();
  else stop();
  return input.node();
}
