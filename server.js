// server.js
// Proxy server nhỏ: nhận request từ game Roblox, tự nó gọi badges.roblox.com
// (vì server này KHÔNG phải domain roblox.com nên không bị Roblox chặn),
// rồi trả tổng số badge về cho game.

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

// Endpoint chính: GET /badges/:userId  ->  { userId, total }
app.get("/badges/:userId", async (req, res) => {
	const userId = req.params.userId;

	if (!/^\d+$/.test(userId)) {
		return res.status(400).json({ error: "Invalid userId" });
	}

	try {
		let total = 0;
		let cursor = "";
		let hasMore = true;

		while (hasMore) {
			let url =
				"https://badges.roblox.com/v1/users/" +
				userId +
				"/badges?limit=100&sortOrder=Asc";

			if (cursor) {
				url += "&cursor=" + encodeURIComponent(cursor);
			}

			const response = await fetch(url);

			if (!response.ok) {
				return res
					.status(502)
					.json({ error: "Failed to fetch from Roblox API", status: response.status });
			}

			const data = await response.json();
			total += data.data ? data.data.length : 0;

			if (data.nextPageCursor) {
				cursor = data.nextPageCursor;
			} else {
				hasMore = false;
			}
		}

		res.json({ userId: userId, total: total });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Route gốc để kiểm tra server có chạy hay không
app.get("/", (req, res) => {
	res.send("Badge Count Proxy is running.");
});

app.listen(PORT, () => {
	console.log("Server running on port " + PORT);
});
