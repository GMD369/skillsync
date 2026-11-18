// Temporary handler for planned endpoints that are not built yet.
export const notImplemented = (feature) => (req, res) =>
  res.status(501).json({ message: `${feature} is planned but not implemented yet` });
