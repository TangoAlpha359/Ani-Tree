function visAnimatedTreemap(data, container, duration) {
  /* Setup */
  const width = 960;
  const height = width;

  const colorClass = d3.scaleOrdinal(
    data.group.keys(),
    [...data.group.keys()].map((key) => key.toLowerCase().replace(/ /g, "-"))
  );

  const formatDate = d3.utcFormat("%b %d, %Y");
  const parseNumber = (str) => +str.replace(/,/g, "");
  const formatNumber = d3.format(",d");
  const isSunday = (date) => date.getUTCDay() === 0;

  // Data wrangling
  const sums = data.keys.map(
    (d, i) => d3.hierarchy(data.group).sum((d) => d.values[i]).value
  );
  const max = d3.max(sums);
  const treemap = d3
    .treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .padding((d) => (d.height === 1 ? 1 : 0))
    .round(true);
  const root = treemap(
    d3
      .hierarchy(data.group)
      .sum((d) => (Array.isArray(d.values) ? d3.sum(d.values) : 0))
      .sort((a, b) => b.value - a.value)
  );
  function layout(index) {
    const k = Math.sqrt(root.sum((d) => d.values[index]).value / max);
    const x = ((1 - k) / 2) * width;
    const y = ((1 - k) / 2) * height;
    return treemap
      .size([width * k, height * k])(root)
      .each((d) => ((d.x0 += x), (d.x1 += x), (d.y0 += y), (d.y1 += y)))
      .leaves();
  }

  /* Render */
  // SVG
  const svg = container
    .append("div")
    .attr("class", "vis-animated-treemap")
    .append("svg")
    .attr("viewBox", [0, -20, width, height + 20]);

  // Box
  const box = svg
    .append("g")
    .selectAll("g")
    .data(
      data.keys
        .map((key, i) => {
          const value = root.sum((d) => d.values[i]).value;
          return { key, value, i, k: Math.sqrt(value / max) };
        })
        .reverse()
    )
    .join("g")
    .attr(
      "transform",
      ({ k }) => `translate(${((1 - k) / 2) * width},${((1 - k) / 2) * height})`
    )
    .attr("opacity", ({ key, i }) => (isSunday(key) || i === 0 ? 1 : 0)) // Only show Sundays' and current date's boxes
    .call((g) =>
      g
        .append("text")
        .attr("class", "box-label")
        .attr("y", -6)
        .selectAll("tspan")
        .data(({ key, value }) => [formatDate(key), ` ${formatNumber(value)}`])
        .join("tspan")
        .attr("class", (d, i) =>
          i === 0 ? "box-label-date" : "box-label-value"
        )
        .text((d) => d)
    )
    .call((g) =>
      g
        .append("rect")
        .attr("class", "box-rect")
        .attr("width", ({ k }) => k * width)
        .attr("height", ({ k }) => k * height)
    );

  // Treemap
  const leaf = svg
    .append("g")
    .selectAll("g")
    .data(layout(0))
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leaf
    .append("rect")
    .attr("id", (d, i) => (d.leafUid = `leaf-${i}`))
    .attr("class", (d) => {
      while (d.depth > 1) d = d.parent;
      return `treemap-leaf-rect ${colorClass(d.data[0])}`;
    })
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  leaf
    .append("clipPath")
    .attr("id", (d, i) => (d.clipUid = `clip-${i}`))
    .append("use")
    .attr("xlink:href", (d) => `#${d.leafUid}`);

  leaf
    .append("text")
    .attr("class", "treemap-leaf-label")
    .attr("clip-path", (d) => `url(#${d.clipUid})`)
    .selectAll("tspan")
    .data((d) => [d.data.name, formatNumber(d.value)])
    .join("tspan")
    .attr("class", (d, i) =>
      i === 0 ? "treemap-leaf-label-state" : "treemap-leaf-label-value"
    )
    .attr("x", 3)
    .attr(
      "y",
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    )
    .text((d) => d);

  leaf.append("title").text((d) => d.data.name);

  function update(index) {
    box
      .transition()
      .duration(duration)
      .attr("opacity", ({ key, i }) =>
        i === index || (i > index && isSunday(key)) ? 1 : 0
      ); // Only show greater than current date's Sundays' and current date's boxes

    leaf
      .data(layout(index))
      .transition()
      .duration(duration)
      .ease(d3.easeLinear)
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
      .call((leaf) =>
        leaf
          .select("rect")
          .attr("width", (d) => d.x1 - d.x0)
          .attr("height", (d) => d.y1 - d.y0)
      )
      .call((leaf) =>
        leaf.select("text tspan:last-child").tween("text", function (d) {
          const i = d3.interpolate(parseNumber(this.textContent), d.value);
          return function (t) {
            this.textContent = formatNumber(i(t));
          };
        })
      );
  }

  return {
    update,
  };
}
