import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import Groq from 'groq-sdk';

export const extractVideoText = async (videoPath) => {
  let localVideoPath = videoPath;
  let downloadedTemp = false;

  try {
    // ✅ If URL, download to /tmp first
    if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
      console.log("🌐 Downloading video from URL:", videoPath);
      const response = await fetch(videoPath);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save to /tmp (Render allows this for temp processing)
      const ext = path.extname(new URL(videoPath).pathname) || '.mp4';
      localVideoPath = `/tmp/${Date.now()}-video${ext}`;
      fs.writeFileSync(localVideoPath, buffer);
      downloadedTemp = true;
      console.log("✅ Video saved to temp:", localVideoPath);
    }

    const audioPath = localVideoPath.replace(
      path.extname(localVideoPath),
      '.mp3'
    );

    await extractAudio(localVideoPath, audioPath);
    const transcript = await transcribeAudio(audioPath);

    // ✅ Cleanup temp files
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    if (downloadedTemp && fs.existsSync(localVideoPath)) fs.unlinkSync(localVideoPath);

    return transcript;

  } catch (error) {
    // Cleanup on error too
    if (downloadedTemp && fs.existsSync(localVideoPath)) fs.unlinkSync(localVideoPath);
    throw error;
  }
};

const extractAudio = (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .save(audioPath)
      .on('end', () => resolve(audioPath))
      .on('error', reject);
  });
};

const transcribeAudio = async (audioPath) => {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const response = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
  });

  return response.text;
};