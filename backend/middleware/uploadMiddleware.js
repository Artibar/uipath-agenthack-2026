import multer from 'multer';

const storage = multer.diskStorage({
    destination(req, file, cb){
        console.log('🔧 MULTER DESTINATION - File:', file.originalname);
        cb(null, 'uploads/');
    },
    filename(req, file, cb){
        console.log('🔧 MULTER FILENAME - File:', file.originalname);
        cb(null, `${Date.now()}-${file.originalname}`)
    },
});

const multerInstance = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024  // 100MB limit
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
            console.log('❌ MULTER ERROR:', err);  // ← Will show the actual error
            return res.status(400).json({ error: 'Multer error: ' + err.message });
        }
        console.log('✅ MULTER SUCCESS - File:', req.file ? req.file.originalname : 'undefined');
        next();
    });
};