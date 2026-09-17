const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "Public")));

// ================================
// CHAT AI
// ================================
app.post("/api/chat", async (req, res) => {
    try {
        const {
            message,
            healthData,
            history
        } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Pesan tidak boleh kosong."
            });
        }

        // API KEY disimpan di Environment Variable
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "GEMINI_API_KEY belum tersedia."
            });
        }

        // ================================
        // DATA NUTRICHECK
        // ================================
        let userHealthData = "Belum ada data kesehatan pengguna.";

        if (
            healthData &&
            Object.keys(healthData).length > 0
        ) {
            userHealthData = `
Data pengguna NutriCheck:
- Usia: ${healthData.age || "-"} tahun
- Jenis kelamin: ${healthData.gender || "-"}
- Tinggi badan: ${healthData.height || "-"} cm
- Berat badan: ${healthData.weight || "-"} kg
- Aktivitas: ${healthData.activity || "-"}
- BMI: ${healthData.bmi || "-"}
- Body Fat: ${healthData.bodyFat || "-"}%
- Energi harian: ${healthData.calories || "-"} kkal
- Cairan: ${healthData.water || "-"} ml/hari
`;
        }

        // ================================
        // RIWAYAT CHAT
        // ================================
        let chatHistory = [];

        if (Array.isArray(history)) {
            chatHistory = history
                .filter((item) => {
                    return (
                        item &&
                        (item.role === "user" ||
                            item.role === "assistant") &&
                        typeof item.content === "string"
                    );
                })
                .slice(-8);
        }

        // ================================
        // SYSTEM PROMPT
        // ================================
        const systemPrompt = `
Kamu adalah NutriCheck AI, asisten AI yang ramah,
natural, informatif, akurat, dan mudah diajak ngobrol.

Kamu bisa menjawab berbagai macam pertanyaan,
bukan hanya tentang kesehatan.

Kamu dapat membantu tentang:
- kesehatan
- nutrisi
- makanan
- olahraga
- aktivitas fisik
- tidur
- hidrasi
- gaya hidup sehat
- pendidikan
- teknologi
- komputer
- jaringan
- pemrograman
- matematika
- bahasa
- kehidupan sehari-hari
- pertanyaan umum lainnya

Jawab sesuai dengan maksud pertanyaan pengguna.
Jangan memaksakan semua pertanyaan menjadi topik kesehatan.

========================
BAHASA
========================

Gunakan Bahasa Indonesia dalam seluruh jawaban.

Gunakan bahasa yang:
- natural
- santai
- ramah
- jelas
- mudah dipahami
- tidak terlalu formal

Jangan tiba-tiba menggunakan Bahasa Inggris.

Bahasa Inggris hanya digunakan jika:
- pengguna memintanya,
- nama produk atau aplikasi,
- nama bahasa pemrograman,
- istilah teknis yang memang umum dalam Bahasa Inggris.

========================
KUALITAS JAWABAN
========================

Prioritas utama:
1. Jawab pertanyaan dengan benar.
2. Gunakan informasi yang akurat.
3. Jelaskan dengan jelas.
4. Pastikan jawaban selesai.
5. Gunakan sesedikit mungkin kata yang tetap diperlukan.

Jawaban pendek tidak masalah jika sudah lengkap.

Jangan bertele-tele.
Jangan menambahkan informasi yang tidak diperlukan.

========================
JANGAN TERPOTONG
========================

- Jangan memotong kalimat.
- Jangan memotong poin.
- Jangan meninggalkan penjelasan yang belum selesai.
- Jangan memulai terlalu banyak poin.
- Jika jawaban terlalu panjang, ringkas dari awal.
- Lebih baik jawaban pendek tetapi selesai.

========================
PANJANG JAWABAN
========================

Pertanyaan sederhana:
- 1 sampai 3 kalimat.

Pertanyaan biasa:
- beberapa kalimat atau beberapa poin singkat.

Pertanyaan yang membutuhkan penjelasan:
- jelaskan secukupnya.

Jika pertanyaan sudah terjawab, langsung berhenti.

Jangan menambahkan pertanyaan lanjutan seperti:
"Ada yang ingin kamu tanyakan lagi?"
atau
"Kalau mau saya bisa..."

========================
FORMAT
========================

Gunakan paragraf biasa atau poin sederhana.

Jangan menggunakan Markdown secara berlebihan.

Hindari judul menggunakan:
###
atau
##

Jangan menggunakan bold secara berlebihan.

========================
SAPaan
========================

Jika pengguna hanya mengatakan:
"hai", "halo", "hello", "pagi", "siang", atau "malam",

jawab secara singkat dan ramah.

Contoh:
"Halo! 👋 Ada yang ingin kamu tanyakan?"

========================
RIWAYAT PERCAKAPAN
========================

Gunakan riwayat chat untuk memahami konteks.

Jika pengguna mengatakan:
"yang tadi", "itu", "kalau ditambah",
atau "yang sebelumnya",

gunakan percakapan sebelumnya untuk memahami maksudnya.

========================
DATA NUTRICHECK
========================

Jika pertanyaan berkaitan dengan hasil NutriCheck,
gunakan data pengguna sebagai konteks.

BMI, body fat, energi harian, dan cairan adalah hasil estimasi,
bukan diagnosis medis.

========================
KESEHATAN
========================

Untuk pertanyaan kesehatan:

- Berikan informasi umum yang aman.
- Jangan memberikan diagnosis medis.
- Jangan mengatakan pengguna pasti memiliki penyakit.
- Jangan memberikan diet ekstrem.
- Jangan menyarankan pembatasan makan ekstrem.
- Untuk pengguna remaja, utamakan pola makan seimbang,
  aktivitas fisik yang wajar, tidur cukup, dan kebiasaan sehat.
- Jika ada keluhan serius, sarankan berkonsultasi
  dengan tenaga kesehatan.

========================
AKURASI
========================

Jangan mengarang fakta.

Jika angka merupakan perkiraan,
jelaskan bahwa itu adalah perkiraan.

Untuk kandungan nutrisi makanan,
nilai bisa berbeda tergantung jenis, ukuran,
bagian makanan, bahan, dan cara memasak.

========================
DATA PENGGUNA
========================

${userHealthData}
`;

        // ================================
        // UBAH HISTORY MENJADI TEKS
        // ================================
        let conversationText = "";

        for (const item of chatHistory) {
            const role =
                item.role === "assistant"
                    ? "NutriCheck AI"
                    : "Pengguna";

            conversationText +=
                `${role}: ${item.content}\n`;
        }

        const finalPrompt = `
${systemPrompt}

========================
RIWAYAT PERCAKAPAN
========================

${conversationText || "Belum ada riwayat percakapan."}

========================
PERTANYAAN TERBARU
========================

Pengguna: ${message}

Jawab pertanyaan pengguna sekarang.
`;

        // ================================
        // REQUEST KE GEMINI
        // ================================
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key":
                        process.env.GEMINI_API_KEY
                },

                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: finalPrompt
                                }
                            ]
                        }
                    ],

                    generationConfig: {
                        maxOutputTokens: 500
                    }
                })
            }
        );

        // ================================
        // RESPONSE GEMINI
        // ================================
        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini Error:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "Gagal mendapatkan jawaban dari Gemini."
            });
        }

        // ================================
        // AMBIL JAWABAN AI
        // ================================
        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            console.error(
                "Response Gemini kosong:",
                data
            );

            return res.status(500).json({
                error:
                    "Gemini tidak memberikan jawaban."
            });
        }

        // ================================
        // KIRIM KE FRONTEND
        // ================================
        res.json({
            reply: reply.trim()
        });

    } catch (error) {
        console.error("Server Error:", error);

        res.status(500).json({
            error:
                "Terjadi kesalahan pada server."
        });
    }
});

// ================================
// SERVER
// ================================
app.listen(PORT, () => {
    console.log("");
    console.log("=================================");
    console.log("       NUTRICHECK AI");
    console.log("=================================");
    console.log(
        `Server: http://localhost:${PORT}`
    );
    console.log(
        "Provider: Google Gemini"
    );
    console.log(
        "Model: gemini-3.5-flash-lite"
    );
    console.log(
        "Max output tokens: 500"
    );
    console.log("=================================");
    console.log("");
});
