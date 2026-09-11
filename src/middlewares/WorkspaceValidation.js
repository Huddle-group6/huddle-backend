const validateCreateWorkspaceInput = (req, res, next) => {
	const { name } = req.body || {};
	if (!name || !name.trim()) {
		return res.status(400).json({ message: "Workspace name is required" });
	}
	if (name.trim().length < 2 || name.trim().length > 100) {
		return res.status(400).json({ message: "Workspace name must be 2-100 characters" });
	}
	next();
};

module.exports = { validateCreateWorkspaceInput };
