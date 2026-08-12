const EARTH_RADIUS_KM = 6371;

function normalizeCoordinate(node) {
  const coordinate = node && node.coordinate;
  const latitude = coordinate && Number(coordinate.latitude);
  const longitude = coordinate && Number(coordinate.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function toRadians(value) {
  return value * Math.PI / 180;
}

function distanceKm(from, to) {
  const a = normalizeCoordinate(from);
  const b = normalizeCoordinate(to);
  if (!a || !b) return null;
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const startLatitude = toRadians(a.latitude);
  const endLatitude = toRadians(b.latitude);
  const value = Math.pow(Math.sin(latitudeDelta / 2), 2)
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.pow(Math.sin(longitudeDelta / 2), 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function routeDistanceKm(nodes) {
  return (nodes || []).slice(1).reduce((total, node, index) => {
    const distance = distanceKm(nodes[index], node);
    return distance === null ? total : total + distance;
  }, 0);
}

function optimizeRoute(nodes) {
  const source = nodes || [];
  const missingCoordinateCount = source.filter((node) => !normalizeCoordinate(node)).length;
  if (source.length < 3 || missingCoordinateCount) {
    return {
      orderedIds: source.map((node) => node.id),
      beforeKm: routeDistanceKm(source),
      afterKm: routeDistanceKm(source),
      missingCoordinateCount,
      changed: false
    };
  }

  const remaining = source.slice(1);
  const ordered = [source[0]];
  while (remaining.length) {
    const current = ordered[ordered.length - 1];
    let nearestIndex = 0;
    let nearestDistance = distanceKm(current, remaining[0]);
    remaining.slice(1).forEach((candidate, index) => {
      const value = distanceKm(current, candidate);
      if (value < nearestDistance) {
        nearestDistance = value;
        nearestIndex = index + 1;
      }
    });
    ordered.push(remaining.splice(nearestIndex, 1)[0]);
  }

  const beforeKm = routeDistanceKm(source);
  const afterKm = routeDistanceKm(ordered);
  const orderedIds = ordered.map((node) => node.id);
  return {
    orderedIds,
    beforeKm,
    afterKm,
    missingCoordinateCount: 0,
    changed: orderedIds.some((id, index) => id !== source[index].id) && afterKm < beforeKm
  };
}

module.exports = { distanceKm, optimizeRoute, routeDistanceKm };
