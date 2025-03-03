const { response, request } = require("express");
const multer = require("multer");
const DocumentIntelligence = require("@azure-rest/ai-document-intelligence").default;
const { getLongRunningPoller, isUnexpected } = require("@azure-rest/ai-document-intelligence");

require("dotenv").config();

const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory

const analyzeDocument = async (req = request, res = response) => {
    const key = process.env.AZURE_API_KEY;
    const endpoint = process.env.AZURE_ENDPOINT;

    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        console.log("Analyzing uploaded file:", req.file.originalname);

        const imageBuffer = req.file.buffer;
        const client = DocumentIntelligence(endpoint, { key: key });

        const initialResponse = await client
            .path("/documentModels/prebuilt-receipt:analyze", "prebuilt-receipt")
            .post({
                contentType: "application/octet-stream",
                body: imageBuffer,
                queryParameters: {
                    "api-version": "2024-11-30",
                    stringIndexType: "utf16CodeUnit",
                    queryFields: "NIT",
                    features: "queryFields",
                },
            });

        if (isUnexpected(initialResponse)) {
            throw initialResponse.body.error;
        }

        const poller = getLongRunningPoller(client, initialResponse);
        const analyzeResult = (await poller.pollUntilDone()).body.analyzeResult;

        const documents = analyzeResult?.documents;
        const result = documents && documents[0];

        let nitValue = null;

        if (result) {
            const MerchantName = result.fields.MerchantName;
            const Items = result.fields.Items;
            const TransactionDate = result.fields.TransactionDate;
            const TransactionTime = result.fields.TransactionTime;
            const Total = result.fields.Total.content;

            if (result.fields.NIT) {
                nitValue = result.fields.NIT.valueString;
            } else {
                const fullText = analyzeResult.content || "";
                const nitMatch = fullText.match(/(?:NIT|Nit|nit)\s*[:\-]?\s*([\d\-]+)/);
                if (nitMatch) {
                    nitValue = nitMatch[1];
                }
            }

            return res.json({
                Merchant: MerchantName?.valueString,
                Date: TransactionDate?.valueDate,
                Time: TransactionTime?.valueTime,
                Items: Items?.valueArray,
                Total: Total,
                NIT: nitValue,
            });
        } else {
            return res.json({ error: "No receipt information found" });
        }
    } catch (err) {
        console.error("Error analyzing document:", err);
        return res.status(500).json({ error: "Error processing the document", details: err });
    }
};

module.exports = {
    analyzeDocument: [upload.single("file"), analyzeDocument],
};
