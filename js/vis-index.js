(function () {
  const DOSES_DATA_URL = "data/vaccine-doses.csv";
  const REGIONS_DATA_URL = "data/census-regions.csv";

  Promise.all([d3.csv(DOSES_DATA_URL), d3.csv(REGIONS_DATA_URL)])
    .then(visProcessData)
    .then(init);

  function init(data) {
    const duration = 2500; // Animation step duration

    const scrubber = visScrubber(
      d3.range(data.keys.length),
      d3.select("#vis-scrubber"),
      {
        format: (i) => d3.utcFormat("%b %d, %Y")(data.keys[i]),
        delay: duration,
        autoplay: false, //True
        loop: false,
      }
    );

    const animatedTreemap = visAnimatedTreemap(
      data,
      d3.select("#vis-animated-treemap"),
      duration
    );

    scrubber.addEventListener("input", function () {
      animatedTreemap.update(this.valueAsNumber);
    });
  }
})();
