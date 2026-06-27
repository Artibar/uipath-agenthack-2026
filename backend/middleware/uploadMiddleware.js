import multer from 'multer';

// ✅ Memory storage — file never touches Render disk
const storage = multer.memoryStorage();

const multerInstance = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024  // 100MB
    },
    fileFilter: (req, file, cb) => {
        console.log('🔧 MULTER FILTER - File:', file.originalname);
        cb(null, true);
    }
});

export const upload = (req, res, next) => {
    console.log('🔧 MULTER STARTING...');
    multerInstance.single("document")(req, res, (err) => {
        if (err) {
            console.log('❌ MULTER ERROR:', err);
            return res.status(400).json({ error: 'Multer error: ' + err.message });
        }
        console.log('✅ MULTER SUCCESS - File:', req.file ? req.file.originalname : 'undefined');
        // ✅ req.file.buffer is now available, req.file.path is gone (not needed)
        next();
    });
};