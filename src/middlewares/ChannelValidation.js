const validateCreateChannelInput = (req, res, next) => {
	const { name } = req.body || {};
	if (!name || !name.trim()) {
		return res.status(400).json({ message: "Channel name is required" });
	}
	if (!/^[a-z0-9-]{2,64}$/.test(name)) {
		return res.status(400).json({
			message: "Channel name must be 2-64 characters: lowercase letters, numbers and '-' only",
		});
	}
	next();
};

const validateSendMessageInput = (req, res, next) => {
	const { body } = req.body || {};
	if (!body || !body.trim()) {
		return res.status(400).json({ message: "Message body is required" });
	}
	if (body.length > 4000) {
		return res.status(400).json({ message: "Message must be 4000 characters or fewer" });
	}
	next();
};

module.exports = { validateCreateChannelInput, validateSendMessageInput };
