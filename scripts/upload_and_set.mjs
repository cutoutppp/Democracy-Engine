import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';

// Load .env variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

async function uploadAndSet() {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    const imageBase64 = fs.readFileSync('C:\\Users\\peera\\.gemini\\antigravity\\brain\\2590e38e-cb8c-4312-99e9-b97d9a14bc3f\\ayutthaya_bg_1786875633420.jpg', 'base64');
    
    console.log("Uploading to ImgBB...");
    const formData = new URLSearchParams();
    formData.append('image', imageBase64);

    const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
    });
    
    const uploadData = await uploadRes.json();
    if (!uploadData.success) {
        console.error("Upload failed", uploadData);
        return;
    }
    
    const imgUrl = uploadData.data.url;
    console.log("ImgBB URL:", imgUrl);

    // Update Neon DB
    const sql = neon(process.env.POSTGRES_URL);
    await sql('UPDATE groups SET bg_image_url = $1 WHERE name = $2', [imgUrl, 'อยุธยามหานคร (Ayutthaya Crisis)']);
    console.log('Updated Neon DB!');
}

uploadAndSet().catch(console.error);
