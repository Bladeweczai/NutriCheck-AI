require("dotenv").config();

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENROUTER_API_KEY;

app.use(express.json());
app.use(express.static("Public"));

app.get("/api/test", function (req, res) {
    res.json({
        status: "ok",
        message: "NutriCheck server aktif"
    });
});

app.post("/api/chat", function (req, res) {
    const message = req.body.message || "";

    if (!API_KEY) {
        return res.status(500).json({
            error: "API key tidak ditemukan."
        });
    }

    const messages = [
        {
            role: "system",
            content:
                "Kamu adalah NutriCheck AI, asisten kesehatan yang ramah. " +
                "Selalu jawab dalam bahasa Indonesia. " +
                "Jawab singkat, jelas, dan langsung ke inti. " +
                "Untuk pertanyaan sederhana cukup 2 sampai 4 kalimat. " +
                "Untuk pertanyaan yang lebih rumit gunakan maksimal 5 poin. " +
                "Jangan bertele-tele. " +
                "Jangan mengulang pertanyaan pengguna. " +
                "Gunakan bahasa yang mudah dipahami. " +
                "Jangan menampilkan proses berpikir atau reasoning internal."
        },
        {
            role: "user",
            content: message
        }
    ];

    fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + API_KEY,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://nutricheck-ai-3.onrender.com",
            "X-Title": "NutriCheck AI"
        },
        body: JSON.stringify({
            model: "openrouter/free",
            messages: messages,
            temperature: 0.3,
            max_tokens: 500
        })
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (
                !data.choices ||
                !data.choices[0] ||
                !data.choices[0].message
            ) {
                console.log("OpenRouter response:", data);

                return res.status(500).json({
                    error: "AI tidak memberikan jawaban."
                });
            }

            const reply = data.choices[0].message.content || "";

            res.json({
                reply: reply.trim()
            });
        })
        .catch(function (error) {
            console.log("ERROR:", error);

            res.status(500).json({
                error: "Terjadi kesalahan saat menghubungi AI."
            });
        });
});

app.listen(PORT, function () {
    console.log(
        "NutriCheck berjalan di port " + PORT
    );
});
