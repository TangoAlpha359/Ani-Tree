function visProcessData([doses, regions]) {
  const states = regions.map((d) => d.State);
  const regionByState = new Map(regions.map((d) => [d.State, d.Region]));
  const divisionByState = new Map(regions.map((d) => [d.State, d.Division]));

  // Accessor for the doses data
  const stateAccessor = (d) => d.Entity;
  const dateAccessor = (d) => d3.utcParse("%-m/%-d/%y")(d.Day);
  const valueAccessor = (d) => +d.total_vaccinations;

  // Use dates as keys
  const keys = [
    ...new d3.InternSet( // Use d3.InternSet instead of the standard JS Set because it doesn't work with Date object
      doses
        .filter((d) => stateAccessor(d) !== "United States") // Filter out United States entries because they contain more dates than states data
        .map(dateAccessor)
    ),
  ].sort(d3.ascending);

  // Build a nested Map for doses value lookup
  const valueByStateByDate = d3.rollup(
    doses,
    (v) => valueAccessor(v[0]),
    stateAccessor,
    dateAccessor
  );

  // Fix state naming issues in doses data
  const nameFix = new Map([["New York", "New York State"]]);
  function fixStateName(state) {
    return nameFix.has(state) ? nameFix.get(state) : state;
  }

  // Build a flat array data that contains states' daily values
  const values = states.map((state) => ({
    name: state,
    values: keys.map((key) =>
      valueByStateByDate.get(fixStateName(state)).get(key)
    ),
  }));

  // Build a hierarchical structure that matches the original animated treemap example data
  const group = d3.group(
    values,
    (d) => regionByState.get(d.name),
    (d) => divisionByState.get(d.name)
  );

  return {
    keys,
    group,
  };
}
