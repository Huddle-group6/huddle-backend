const validateCreateChannelInput = (req, res, next) => {
	const { name } = req.body || {};
	if (!name || !name.trim()) {
		return res.status(400).json({ message: "Channel name is required" });
	}
	if (!/^(?=.{2,64}$)[A-Za-z]+(?: [A-Za-z]+)*$/.test(name.trim())) {
		return res.status(400).json({
			message:
				"Channel name must be 2-64 characters: uppercase and lowercase letters with spaces only, no numbers or special characters",
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
		return res
			.status(400)
			.json({ message: "Message must be 4000 characters or fewer" });
	}
	next();
};

module.exports = { validateCreateChannelInput, validateSendMessageInput };
