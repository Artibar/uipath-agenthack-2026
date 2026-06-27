export const classifyDocument = (mimetype, source) => {
    if (mimetype === "application/pdf") {
        return "pdf";
    }

    // Real DOCX only
    if (
        mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        return "docx";
    }

    // Old DOC
    if (mimetype === "application/msword") {
        return "doc";
    }

    if (mimetype.includes("video")) {
        return "video";
    }

    if (source?.startsWith("http")) {
        return "url";
    }

    throw new Error("Unsupported document type");
};