import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg';
import Groq from 'groq-sdk'

export const extractVideoText = async(videoPath)=>{
    const audioPath = videoPath.replace(
        path.extname(videoPath),
        '.mp3'
    )
    await extractAudio(videoPath, audioPath);
    const transcript = await transcribeAudio(audioPath);
    if(fs.existsSync(audioPath)){
        fs.unlinkSync(audioPath);
    }
    return transcript;
};

const extractAudio = (videoPath, audioPath)=>{
    return new Promise((resolve, reject)=>{
        ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .save(audioPath)
        .on('end', ()=>resolve(audioPath))
        .on('error', reject);
    });
};

const transcribeAudio = async(audioPath)=>{
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
    
    const response = await groq.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-large-v3',
        response_format: 'verbose_json',
    });
    return response.text
}